import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/Addons.js';
import { XelisNode } from '../../app/xelis_node';
import { Block, RPCMethod as DaemonRPCMethod, HeightRangeParams, RPCEvent as DaemonRPCEvent, BlockOrdered, BlockType } from '@xelis/sdk/daemon/types';
import { block_type_colors } from '../block_type_box/block_type_box';
import CameraControls from 'camera-controls';
import { RPCRequest } from '@xelis/sdk/rpc/types';
import { OverlayLoading } from '../overlay_loading/overlay_loading';
import { DAGBlockDetails } from './block_details/block_details';
import { clamp_number } from '../../utils/clamp_number';
import { HeightControl } from './height_control/height_control';
//@ts-ignore
import { Text } from 'troika-three-text';
//@ts-ignore
import InfiniteGridHelper from './infinite_grid_helper.js';
import { localization } from '../../localization/localization';

import './dag.css';

const DAG_TIP_LINE_COLOR = `#24403d`;
const DAG_HIGHLIGHT_COLOR = `#f5f7fb`;

const three_lib_for_camera = {
    Vector2: THREE.Vector2,
    Vector3: THREE.Vector3,
    Vector4: THREE.Vector4,
    Quaternion: THREE.Quaternion,
    Matrix4: THREE.Matrix4,
    Spherical: THREE.Spherical,
    Box3: THREE.Box3,
    Sphere: THREE.Sphere,
    Raycaster: THREE.Raycaster,
};

CameraControls.install({ THREE: three_lib_for_camera });

export class DAG {
    element: HTMLDivElement;
    canvas: HTMLCanvasElement;

    scene: THREE.Scene;
    renderer: THREE.WebGLRenderer;
    orthographic_camera: THREE.OrthographicCamera;
    controls: CameraControls;
    clock: THREE.Clock;
    raycaster: THREE.Raycaster;
    pointer: THREE.Vector2;

    block_group: THREE.Group;
    tip_line_group: THREE.Group;
    height_group: THREE.Group;

    overlay_loading: OverlayLoading;
    block_details: DAGBlockDetails;
    height_control: HeightControl;
    hovered_block_box_mesh?: THREE.Mesh;
    highlighted_block_box_mesh?: THREE.Mesh;

    block_mesh_hashes: Map<string, THREE.Group>;
    tip_mesh_hashes: Map<string, THREE.Line>;
    height_mesh_map: Map<number, THREE.Group>;
    blocks_by_height: Map<number, Block[]>;

    is_live: boolean;
    lock_camera_to_current_height: boolean;
    target_height_line: THREE.Line;
    stable_height_line: THREE.Line;
    lock_block_height?: number;
    load_height: number;

    block_spacing = 6;
    max_display_height = 100;
    animation_loop_active = false;
    load_timeout?: number;

    constructor() {
        this.element = document.createElement(`div`);
        this.element.classList.add(`xe-dag-viewer`);

        this.load_height = 0;
        this.lock_camera_to_current_height = true;

        this.block_mesh_hashes = new Map();
        this.tip_mesh_hashes = new Map();
        this.height_mesh_map = new Map();
        this.blocks_by_height = new Map();

        this.block_details = new DAGBlockDetails();
        this.element.appendChild(this.block_details.element);

        this.overlay_loading = new OverlayLoading();
        this.element.appendChild(this.overlay_loading.element);

        this.clock = new THREE.Clock();
        this.scene = new THREE.Scene();
        this.canvas = document.createElement(`canvas`);
        this.scene.background = null;
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            canvas: this.canvas
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor(0x000000, 0);

        this.raycaster = new THREE.Raycaster();
        this.pointer = new THREE.Vector2();

        const rect = this.element.getBoundingClientRect();
        this.renderer.setSize(rect.width, rect.height);
        this.element.appendChild(this.renderer.domElement);

        this.orthographic_camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 2000);

        this.orthographic_camera.zoom = 20;
        this.orthographic_camera.position.set(0, 0, 1);

        this.controls = new CameraControls(this.orthographic_camera, this.renderer.domElement);
        this.controls.truckSpeed = 1;
        this.controls.maxZoom = 30;
        this.controls.minZoom = 10;
        this.controls.mouseButtons.left = CameraControls.ACTION.TRUCK;
        this.controls.mouseButtons.middle = CameraControls.ACTION.ZOOM;
        this.controls.touches.one = CameraControls.ACTION.TOUCH_TRUCK;

        this.controls.addEventListener(`controlstart`, () => {
            this.block_details.hide();
        });

        // size1, size2, color, distance, axes = 'xzy'
        const grid = new InfiniteGridHelper(1, 5, new THREE.Color(`#0c3a34`), 50, 'xzy');
        grid.rotation.x = -Math.PI / 2;
        grid.position.z = -4;
        this.scene.add(grid);

        this.target_height_line = this.create_target_line(new THREE.Color(`#2cffcf`));
        this.scene.add(this.target_height_line);

        this.stable_height_line = this.create_target_line(new THREE.Color(`#f5d95f`));
        this.scene.add(this.stable_height_line);

        this.tip_line_group = new THREE.Group();
        this.scene.add(this.tip_line_group);

        this.block_group = new THREE.Group();
        this.scene.add(this.block_group);

        this.height_group = new THREE.Group();
        this.scene.add(this.height_group);

        window.addEventListener('resize', this.on_resize);

        this.element.addEventListener(`pointermove`, this.on_pointer_move);
        this.element.addEventListener(`click`, this.on_click);

        this.height_control = new HeightControl();
        this.height_control.add_listener(`new_height`, async (height) => {
            if (height !== undefined) {
                await this.load_blocks_timeout(height);
                this.set_live(false);
            }
        });

        this.is_live = false;
        this.height_control.live_btn_element.addEventListener(`click`, () => {
            this.set_live(!this.is_live);
        });

        this.height_control.prev_height_element.addEventListener(`click`, async () => {
            this.load_height -= 10;
            this.height_control.set_height(this.load_height);
            this.load_blocks_timeout(this.load_height);
        });

        this.height_control.next_height_element.addEventListener(`click`, async () => {
            this.load_height += 10;
            this.height_control.set_height(this.load_height);
            this.load_blocks_timeout(this.load_height);
        });

        this.height_control.lock_cam_element.addEventListener(`click`, () => {
            this.lock_camera_to_current_height = !this.lock_camera_to_current_height;
            if (this.lock_camera_to_current_height) {
                this.height_control.lock_cam_element.innerHTML = localization.get_text(`UNLOCK CAM`);
            } else {
                this.height_control.lock_cam_element.innerHTML = localization.get_text(`LOCK CAM`);
            }
        });

        this.element.appendChild(this.height_control.element);
    }

    on_new_block = async (new_block?: Block, err?: Error) => {
        console.log("new_block", new_block);

        if (new_block) {
            const new_height = new_block.height;
            if (this.block_mesh_hashes.get(new_block.hash)) {
                // skip if block already added
                return;
            }

            this.add_block_to_height(new_block);

            const min_height = Math.min(...this.blocks_by_height.keys());
            if (this.blocks_by_height.size > this.max_display_height) {
                this.delete_height(min_height);
            }

            const block_mesh = this.create_block_mesh(new_block);
            const blocks_at_height = this.blocks_by_height.get(new_height);
            this.block_group.add(block_mesh);

            new_block.tips.forEach((hash) => {
                const block_mesh_target = this.block_mesh_hashes.get(hash);
                if (block_mesh_target) {
                    const tip_hash = this.create_tip_hash(new_block.hash, hash);
                    const line_mesh = this.create_tip_line_mesh(block_mesh, block_mesh_target, tip_hash);
                    this.tip_mesh_hashes.set(tip_hash, line_mesh);
                    this.tip_line_group.add(line_mesh);
                }
            });

            const height_mesh = this.height_mesh_map.get(new_height);
            const block_count = blocks_at_height ? blocks_at_height.length : 0;
            const block_center_y = -(block_count / 2 * 5 + 2);
            const block_x = (new_height - this.load_height) * this.block_spacing;

            if (height_mesh) {
                height_mesh.position.set(block_x, block_center_y, 0);
            } else {
                const new_height_mesh = this.create_height_mesh(new_height);
                new_height_mesh.position.set(block_x, block_center_y, 0);
                this.height_group.add(new_height_mesh);
                this.height_mesh_map.set(new_height, new_height_mesh);
            }

            // recenter blocks mesh, tips mesh positions
            if (blocks_at_height) {
                blocks_at_height.forEach((block, y) => {
                    const block_mesh = this.block_mesh_hashes.get(block.hash);
                    if (block_mesh) {
                        const center_y = ((y * 5) - (blocks_at_height.length / 2 * 5)) + 2.5;
                        block_mesh.position.set(block_x, center_y, 0);

                        block.tips.forEach((hash) => {
                            const block_target_mesh = this.block_mesh_hashes.get(hash);
                            if (block_target_mesh) {
                                const tip_hash = this.create_tip_hash(block.hash, hash);
                                const tip_mesh = this.tip_mesh_hashes.get(tip_hash);
                                if (tip_mesh) {
                                    tip_mesh.geometry.setFromPoints([
                                        block_mesh.position,
                                        block_target_mesh.position
                                    ]);
                                }
                            }
                        });
                    }
                });
            }

            // this.animate_block_appear(block_mesh); applied in on_block_ordered
            this.height_control.set_height(new_height);
            this.height_control.set_max_height(new_height);
            if (this.lock_camera_to_current_height) {
                this.move_to_height(this.lock_block_height ? this.lock_block_height : new_block.height, true);
            }

            const node = XelisNode.instance();
            const stable_height = await node.ws.methods.getStableHeight();
            this.move_stable_height_line(stable_height);

            this.blocks_by_height.forEach((blocks, height) => {
                if (
                    blocks.length === 1 &&
                    height <= stable_height
                ) {
                    const single_block = blocks[0];
                    if (single_block.block_type === BlockType.Normal) {
                        single_block.block_type = BlockType.Sync;

                        const block_mesh = this.block_group.children.find(b => {
                            return b.userData.block.hash === single_block.hash;
                        });

                        if (block_mesh) {
                            const new_block_mesh = this.create_block_mesh(single_block);
                            new_block_mesh.position.copy(block_mesh.position);
                            this.block_group.remove(block_mesh);
                            this.dispose_group(block_mesh as THREE.Group);
                            this.block_group.add(new_block_mesh);
                        }
                    }
                }
            });
        }
    }

    delete_height(height: number) {
        this.height_mesh_map.delete(height);
        this.height_group.children.forEach((height_mesh) => {
            if (height_mesh.userData.height === height) {
                this.height_group.remove(height_mesh);
                this.dispose_group(height_mesh as THREE.Group);
            }
        });

        const blocks_to_delete = this.blocks_by_height.get(height);
        if (blocks_to_delete) {
            blocks_to_delete.forEach((block) => {
                const block_mesh = this.block_mesh_hashes.get(block.hash);
                if (block_mesh) {
                    this.block_group.remove(block_mesh);
                    this.dispose_group(block_mesh);
                    this.block_mesh_hashes.delete(block.hash);
                }
            });
            this.blocks_by_height.delete(height);
            this.delete_tip_lines(height);
        }
    }

    delete_tip_lines(target_height: number) {
        const tip_lines_to_delete = this.tip_line_group.children.filter((tip_line_mesh) => {
            const block_target_height = tip_line_mesh.userData.block_target_height;
            return block_target_height === target_height;
        }) as THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial>[];

        tip_lines_to_delete.forEach((tip_line) => {
            this.tip_mesh_hashes.delete(tip_line.userData.hash);
            this.tip_line_group.remove(tip_line);
            tip_line.geometry.dispose();
            tip_line.material.dispose();
        });
    }

    on_block_ordered = async (block_ordered?: BlockOrdered | undefined, err?: Error) => {
        console.log("block_ordered", block_ordered);
        if (block_ordered) {
            const node = XelisNode.instance();
            const block = await node.ws.methods.getBlockByHash({
                hash: block_ordered.block_hash
            });

            const block_mesh = this.block_mesh_hashes.get(block_ordered.block_hash);
            if (block_mesh) {
                const new_block_mesh = this.create_block_mesh(block);
                new_block_mesh.position.copy(block_mesh.position);
                this.block_group.remove(block_mesh);
                this.dispose_group(block_mesh);
                this.block_group.add(new_block_mesh);
                this.animate_block_appear(new_block_mesh);

                // TODO: maybe tips changed...
            }
        }
    }

    async set_live(live: boolean) {
        if (this.is_live === live) return;

        if (live) {
            // Start listening for new_block events immediately, even before loading the primary block fetch.
            // If we listen after we could miss some blocks and create gaps in the DAG display.
            this.listen_node_events();

            try {
                const node = XelisNode.instance();
                const current_height = await node.rpc.getHeight();
                await this.load_blocks(current_height);
                this.is_live = true;
            } catch (err) {
                this.clear_node_events();
                throw err
            }

            if (this.lock_block_height) {
                this.move_to_height(this.lock_block_height, true);
            }

            this.height_control.live_btn_element.classList.add(`active`);
            this.height_control.next_height_element.style.display = `none`;
            this.height_control.prev_height_element.style.display = `none`;
        }
        else {
            this.clear_node_events();
            this.height_control.live_btn_element.classList.remove(`active`);
            this.height_control.next_height_element.style.removeProperty(`display`);
            this.height_control.prev_height_element.style.removeProperty(`display`);
            this.is_live = false;
        }

        this.start_animation_loop();
    }

    start_animation_loop() {
        if (this.animation_loop_active) return;
        this.animation_loop_active = true;
        this.renderer.setAnimationLoop(this.on_update);
    }

    stop_animation_loop() {
        if (!this.animation_loop_active) return;
        this.animation_loop_active = false;
        this.renderer.setAnimationLoop(null);
    }

    unload() {
        this.block_details.hide();
        this.set_live(false); // clear listener and set live flag to false
        this.stop_animation_loop();
        this.dispose_objects();
        this.target_height_line.remove();
        this.stable_height_line.remove();
        this.height_control.clear_listeners();
        window.removeEventListener('resize', this.on_resize);
    }

    listen_node_events() {
        const node = XelisNode.instance();
        node.ws.methods.addListener(DaemonRPCEvent.NewBlock, null, this.on_new_block);
        node.ws.methods.addListener(DaemonRPCEvent.BlockOrdered, null, this.on_block_ordered);
    }

    clear_node_events() {
        const node = XelisNode.instance();
        node.ws.methods.removeListener(DaemonRPCEvent.NewBlock, null, this.on_new_block);
        node.ws.methods.removeListener(DaemonRPCEvent.BlockOrdered, null, this.on_block_ordered);
    }

    update_size() {
        const rect = this.element.getBoundingClientRect();

        this.orthographic_camera.left = rect.width / -2;
        this.orthographic_camera.right = rect.width / 2;
        this.orthographic_camera.top = rect.height / 2;
        this.orthographic_camera.bottom = rect.height / -2;
        this.orthographic_camera.updateProjectionMatrix();
        this.renderer.setSize(rect.width, rect.height);
    }

    on_resize = () => {
        this.update_size();
    }

    on_pointer_move = (e: PointerEvent) => {
        const rect = this.element.getBoundingClientRect();
        const offset_client_x = e.clientX - rect.x;
        const offset_client_y = e.clientY - rect.y;
        const x = (offset_client_x / rect.width) * 2 - 1;
        const y = -(offset_client_y / rect.height) * 2 + 1;
        this.pointer.x = x;
        this.pointer.y = y;
    }

    on_click = (e: MouseEvent) => {
        const rect = this.element.getBoundingClientRect();
        const offset_mouse_x = e.clientX - rect.x;
        const offset_mouse_y = e.clientY - rect.y;

        if (this.hovered_block_box_mesh && this.hovered_block_box_mesh.parent) {
            const block = this.hovered_block_box_mesh.parent.userData.block as Block;
            const block_details_rect = this.block_details.element.getBoundingClientRect();

            let block_details_x = offset_mouse_x + 20;
            let block_details_y = offset_mouse_y - (block_details_rect.height / 2);

            // make sure the block details box does not go off screen
            block_details_x = clamp_number(block_details_x, 0, rect.width - block_details_rect.width - 20);
            block_details_y = clamp_number(block_details_y, 0, rect.height - (block_details_rect.height / 2));

            this.block_details.set(block);
            this.block_details.set_position(block_details_x, block_details_y);
            this.block_details.show();
        } else {
            this.block_details.hide();
        }
    }

    dispose_objects() {
        this.dispose_group(this.tip_line_group);
        this.tip_line_group.clear();

        this.dispose_group(this.block_group);
        this.block_group.clear();

        this.dispose_group(this.height_group);
        this.height_group.clear();

        this.block_mesh_hashes.clear();
        this.blocks_by_height.clear();

        this.hovered_block_box_mesh = undefined;
        this.highlighted_block_box_mesh = undefined;
    }

    load_blocks_timeout(height: number) {
        window.clearTimeout(this.load_timeout);
        this.load_timeout = window.setTimeout(() => {
            this.load_blocks(height);
        }, 500);
    }

    async load_blocks(height: number) {
        this.canvas.classList.add(`xe-dag-load-flash`);
        this.load_height = height;
        this.stable_height_line.visible = false;
        this.target_height_line.visible = false;
        this.dispose_objects();

        const node = XelisNode.instance();

        const max_height = await node.rpc.getHeight();
        this.height_control.set_height(height);
        this.height_control.set_max_height(max_height);

        const height_count = Math.round(this.max_display_height / 2);
        const start_height = Math.max(0, height - height_count);
        const end_height = Math.min(max_height, height + height_count);

        this.load_height = Math.max(0, Math.min(max_height, height));

        const requests = [] as RPCRequest[];
        for (let i = start_height; i < end_height; i += 20) {
            let start = i;
            let end = i + 20 - 1;
            if (end > end_height) {
                end = end_height;
            }

            requests.push({
                method: DaemonRPCMethod.GetBlocksRangeByHeight,
                params: {
                    start_height: start,
                    end_height: end
                } as HeightRangeParams
            });
        }

        const res = await node.rpc.batchRequest(requests);

        this.controls.normalizeRotations().reset(true);
        let blocks = [] as Block[];
        res.forEach((result, i) => {
            if (result instanceof Error) {
                throw result;
            } else {
                blocks = [...blocks, ...result as Block[]];
            }
        });

        for (let i = 0; i < blocks.length; i++) {
            const block = blocks[i];
            this.add_block_to_height(block);
        }

        this.blocks_by_height.forEach((height_blocks, block_height) => {
            height_blocks.forEach((block, y) => {
                const block_mesh = this.create_block_mesh(block);
                const center_y = ((y * 5) - (height_blocks.length / 2 * 5)) + 2.5;
                block_mesh.position.set((block_height - this.load_height) * this.block_spacing, center_y, 0);
                this.block_group.add(block_mesh);
            });

            const height_mesh = this.create_height_mesh(block_height);
            const center_y = -(height_blocks.length / 2 * 5 + 2);
            height_mesh.position.set((block_height - this.load_height) * this.block_spacing, center_y, 0);
            this.height_group.add(height_mesh);
        });

        this.block_group.children.forEach((block_mesh) => {
            const block = block_mesh.userData.block as Block;
            block.tips.forEach((hash) => {
                const block_mesh_target = this.block_mesh_hashes.get(hash);
                if (block_mesh_target) {
                    const tip_hash = this.create_tip_hash(block.hash, hash);
                    const line_mesh = this.create_tip_line_mesh(block_mesh as THREE.Group, block_mesh_target, tip_hash);
                    this.tip_line_group.add(line_mesh);
                }
            });
        });

        this.target_height_line.visible = true;
        this.move_to_height(this.load_height, false);
        this.canvas.classList.remove(`xe-dag-load-flash`);

        const stable_height = await node.ws.methods.getStableHeight();
        this.move_stable_height_line(stable_height);

        this.start_animation_loop();
    }

    move_stable_height_line(height: number) {
        const block_mesh = this.block_group.children.find((b) => {
            return b.userData.block.height === height;
        });

        if (block_mesh) {
            const x = block_mesh.position.x;
            this.stable_height_line.position.set(x, 0, 0);
            this.stable_height_line.visible = true;
        } else {
            this.stable_height_line.visible = false;
        }
    }

    move_to_height(height: number, enable_transition: boolean) {
        const block_mesh = this.block_group.children.find((b) => {
            return b.userData.block.height === height;
        });

        if (block_mesh) {
            const x = block_mesh.position.x;
            this.target_height_line.position.set(x, 0, 0);
            this.controls.moveTo(x, 0, 0, enable_transition);
        }
    }

    add_block_to_height(block: Block) {
        const height_blocks = this.blocks_by_height.get(block.height) || [];
        if (!height_blocks.find(b => b.hash === block.hash)) {
            this.blocks_by_height.set(block.height, [...height_blocks, block]);
        }
    }

    create_tip_hash(block_hash: string, block_target_hash: string) {
        return `${block_hash}${block_target_hash}`;
    }

    set_tip_lines_color(block_mesh: THREE.Mesh, color: THREE.Color) {
        if (block_mesh.parent) {
            const block = block_mesh.parent.userData.block as Block;
            const hashes = block.tips.map(hash => this.create_tip_hash(block.hash, hash));
            this.tip_line_group.children.forEach((tip_line) => {
                const tip_line_mesh = tip_line as THREE.Mesh;
                const tip_line_mat = tip_line_mesh.material as THREE.LineBasicMaterial;
                if (hashes.indexOf(tip_line.userData.hash) !== -1) {
                    tip_line_mat.color.set(color);
                }
            });
        }
    }


    highlight_block(block: Block) {
        if (this.highlighted_block_box_mesh) {
            const mat = this.highlighted_block_box_mesh.material as THREE.ShaderMaterial;
            mat.uniforms.enable_outline.value = false;
            this.set_tip_lines_color(this.highlighted_block_box_mesh, new THREE.Color(DAG_TIP_LINE_COLOR));
        }

        const block_mesh = this.block_mesh_hashes.get(block.hash);
        if (block_mesh) {
            const box_mesh = block_mesh.getObjectByProperty(`name`, `box_mesh`) as THREE.Mesh | undefined;
            if (box_mesh) {
                this.highlighted_block_box_mesh = box_mesh;
                const mat = box_mesh.material as THREE.ShaderMaterial;
                mat.uniforms.outline_color.value = new THREE.Color(DAG_HIGHLIGHT_COLOR);
                mat.uniforms.enable_outline.value = true;
                this.set_tip_lines_color(box_mesh, new THREE.Color(DAG_HIGHLIGHT_COLOR));
            }
        }
    }

    intercept_block() {
        const box_meshes = this.block_group.getObjectsByProperty(`name`, `box_mesh`) as THREE.Mesh[];
        const intersects = this.raycaster.intersectObjects<THREE.Mesh>(box_meshes);

        if (intersects.length > 0) {
            const box_mesh = intersects[0].object as THREE.Mesh;

            if (this.hovered_block_box_mesh !== box_mesh) {  // Only update if different
                // Clear previous hover
                if (this.hovered_block_box_mesh) {
                    this.set_tip_lines_color(this.hovered_block_box_mesh, new THREE.Color(DAG_TIP_LINE_COLOR));
                    const mat = this.hovered_block_box_mesh.material as THREE.ShaderMaterial;
                    mat.uniforms.enable_outline.value = false;
                }

                // Set new hover
                if (this.highlighted_block_box_mesh !== box_mesh) {
                    const mat = box_mesh.material as THREE.ShaderMaterial;
                    mat.uniforms.outline_color.value = new THREE.Color(DAG_HIGHLIGHT_COLOR);
                    mat.uniforms.enable_outline.value = true;
                    if (box_mesh.parent) {
                        this.set_tip_lines_color(box_mesh, new THREE.Color(DAG_HIGHLIGHT_COLOR));
                    }
                }
                this.hovered_block_box_mesh = box_mesh;
            }
        } else if (this.hovered_block_box_mesh) {
            // Clear hover
            if (this.hovered_block_box_mesh !== this.highlighted_block_box_mesh) {
                this.set_tip_lines_color(this.hovered_block_box_mesh, new THREE.Color(DAG_TIP_LINE_COLOR));
                const mat = this.hovered_block_box_mesh.material as THREE.ShaderMaterial;
                mat.uniforms.enable_outline.value = false;
            }
            this.hovered_block_box_mesh = undefined;
        }
    }

    create_target_line(color: THREE.Color) {
        const mat = new THREE.LineBasicMaterial({ color });

        const points = [
            new THREE.Vector3(0, -10000, -3),
            new THREE.Vector3(0, 10000, -3)
        ];

        const geo = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(geo, mat);
        return line;
    }

    create_tip_line_mesh(block_mesh: THREE.Group, block_target_mesh: THREE.Group, hash: string) {
        const mat = new THREE.LineBasicMaterial({ color: new THREE.Color(DAG_TIP_LINE_COLOR) });

        const points = [
            block_mesh.position,
            block_target_mesh.position
        ];

        const block_target = block_target_mesh.userData.block;

        const geo = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(geo, mat);
        line.position.z = -3;
        line.userData.hash = hash;
        line.userData.block_target_height = block_target.height;
        return line;
    }

    async animate_block_appear(block_group: THREE.Group) {
        const { animate, eases } = await import("animejs");

        animate(block_group.scale, {
            x: [0.7, 1],
            y: [0.7, 1],
            z: [0.7, 1],
            duration: 1000,
            ease: eases.outBack(3)
        });
    }

    set_block_opacity(block_group: THREE.Group, opacity: number) {
        block_group.children.forEach((child) => {
            if (child instanceof THREE.Mesh) {
                const mat = child.material;
                if (mat instanceof THREE.MeshBasicMaterial) {
                    mat.opacity = opacity;
                }

                if (mat instanceof THREE.ShaderMaterial) {
                    mat.uniforms.opacity = { value: opacity };
                }
            }
        });
    }

    get_width_text(text: string) {
        const canvas = document.createElement(`canvas`);
        const context = canvas.getContext(`2d`);
        if (context) {
            const metrics = context.measureText(text);
            return metrics.width;
        }
        throw "missing 2d context";
    }

    create_height_mesh(height: number) {
        const height_group = new THREE.Group();
        height_group.userData.height = height;

        const text = new Text();
        text.text = height.toLocaleString();
        text.fontSize = .8;
        text.position.set(0, .65, -1);
        text.color = `#f5f7fb`;
        text.anchorX = `center`;

        const back_width = this.get_width_text(text.text) / 10;
        // back
        const back_geo = new RoundedBoxGeometry(back_width, 1.25, 1, 10, 1);
        const back_mat = new THREE.MeshBasicMaterial({
            color: new THREE.Color(`#071416`),
            transparent: true,
            opacity: .92,
            side: THREE.DoubleSide
        });
        const back_mesh = new THREE.Mesh(back_geo, back_mat);
        back_mesh.position.z = -2;
        height_group.add(back_mesh);
        height_group.add(text);

        return height_group;
    }

    create_block_mesh(block: Block) {
        const size = 2.5;
        const block_mesh = new THREE.Group();
        block_mesh.userData.block = block;

        const color = block_type_colors[block.block_type];

        const uniforms = {
            color: { type: 'vec3', value: new THREE.Color(color) },
            outline_color: { type: 'vec3', value: new THREE.Color(`white`) },
            enable_outline: { value: false },
            opacity: { value: 1 }
        };

        function vertexShader() {
            return `
                varying vec3 v_uv; 

                void main() {
                    v_uv = position; 
                    vec4 model_view_position = modelViewMatrix * vec4(position, 1.0);
                    gl_Position = projectionMatrix * model_view_position; 
                }
            `;
        }

        function fragmentShader() {
            return `
                uniform vec3 color; 
                uniform vec3 outline_color;
                uniform bool enable_outline;
                uniform float opacity;
                varying vec3 v_uv;
         
                void main() {
                    vec2 st = v_uv.xy;
                    vec3 new_color = color;
                    float outline_size = 1.1;

                    if (enable_outline) {
                        if (
                            st.x > outline_size || 
                            st.x < -outline_size ||
                            st.y > outline_size || 
                            st.y < -outline_size
                        ) {
                            new_color = outline_color;
                        }
                    }

                    gl_FragColor = vec4(new_color, opacity);
                }
            `;
        }

        const geo = new RoundedBoxGeometry(size, size, 0.5, 10, 0.5);
        const mat = new THREE.ShaderMaterial({
            uniforms: uniforms,
            fragmentShader: fragmentShader(),
            vertexShader: vertexShader(),
            transparent: true
        });
        const box = new THREE.Mesh(geo, mat);
        box.position.z = -2;
        box.name = "box_mesh";
        block_mesh.add(box);

        // hash
        {
            const text = new Text();
            text.text = block.hash.substring(block.hash.length - 6);
            text.fontSize = .7;
            text.color = color;
            text.anchorX = `center`;
            text.position.set(0, 2.25, -1);
            block_mesh.add(text);
        }

        // topoheight
        {
            const topo = block.topoheight !== undefined ? block.topoheight.toLocaleString() : `????`;
            const text = new Text();
            text.text = topo;
            text.fontSize = .7;
            text.color = color;
            text.anchorX = `center`;
            text.position.set(0, -1.25, -1);
            block_mesh.add(text);
        }

        // block type
        {
            const first_letter = block.block_type.substring(0, 1).toUpperCase();
            const text = new Text();
            text.text = first_letter;
            text.fontSize = 1.5;
            text.color = `#041414`;
            text.anchorX = `center`;
            text.position.set(0, 1.1, -1);
            block_mesh.add(text);
        }

        this.block_mesh_hashes.set(block.hash, block_mesh);
        return block_mesh;
    }

    on_update = (time: number) => {
        this.raycaster.setFromCamera(this.pointer, this.orthographic_camera);
        this.intercept_block();

        const delta = this.clock.getDelta();
        this.controls.update(delta);
        this.renderer.render(this.scene, this.orthographic_camera);
    }

    // there are some objects that needs to be dipose() manually like BufferGeometry, etc...
    dispose_group(group: THREE.Group) {
        group.children.forEach(child => {
            const obj = child as any;
            if (obj instanceof THREE.Group) {
                this.dispose_group(obj);
            } else {
                obj.geometry.dispose();
                obj.material.dispose();
                if (obj.dispose) obj.dispose();
            }
        });
    }
}
