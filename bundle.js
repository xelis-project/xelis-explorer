import * as esbuild from 'esbuild'
import yargs from 'yargs'
import fs from 'fs'

const argv = yargs(process.argv)
  .option(`watch`, {
    alias: `a`,
    type: `boolean`,
    default: false
  })
  .option(`sourcemap`, {
    alias: `sm`,
    type: `boolean`,
    default: false
  })
  .option(`minify`, {
    alias: `m`,
    type: `boolean`,
    default: false
  })
  .option(`env`, {
    alias: `e`,
    type: `string`
  }).parse()


const main = async () => {
  const outdir = `./public/dist`

  fs.rmSync(outdir, { recursive: true, force: true })

  const envData = fs.readFileSync(`./env/${argv.env}.json`, { encoding: `utf-8` })
  const env = JSON.parse(envData)
  Object.keys(env).forEach((key) => {
    const value = env[key]
    if (typeof value === 'string') env[key] = `"${value}"`
  })

  const options = {
    entryPoints: [`./src/index`],
    bundle: true,
    loader: {
      '.js': `jsx`,
      '.woff': 'text',
      '.woff2': 'text'
    },
    jsx: `automatic`,
    outdir,
    minify: argv.minify,
    sourcemap: `inline`,//argv.sourcemap,
    define: env,
    plugins: [{
      name: 'log-rebuild',
      setup(build) {
        build.onEnd(() => {
          console.log(`Rebuild - ${new Date().toLocaleString()}`)
        })
      },
    }]
  }


  if (argv.watch) {
    const ctx = await esbuild.context(options)
    await ctx.watch()
  } else {
    await esbuild.build(options)
  }
}

main()
