const esbuild = require(`esbuild`)
const yargs = require(`yargs`)
const fs = require('fs')
const stylePlugin = require('esbuild-style-plugin')
const autoprefixer = require('autoprefixer')
const prefixer = require('postcss-prefix-selector')
const path = require('path')

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

  const envData = fs.readFileSync(`./env_public/${argv.env}.json`, { encoding: `utf-8` })
  const env = JSON.parse(envData)
  Object.keys(env).forEach((key) => {
    const value = env[key]
    if (typeof value === 'string') env[key] = `"${value}"`
  })

  const sourcemap = argv.sourcemap ? `inline` : false

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
    sourcemap,
    define: env,
    external: [`*.svg`],
    plugins: [
      stylePlugin({
        postcss: {
          plugins: [
            autoprefixer(),
            /*prefixer({
              // add style prefix to css
              transform: function (prefix, selector, prefixedSelector, filePath, rule) {
                if (filePath.indexOf(`\\style\\classic`) !== -1) {
                  return `[data-style=classic] ${selector}`
                }

                if (filePath.indexOf(`\\style\\xelis`) !== -1) {
                  return `[data-style=xelis] ${selector}`
                }

                return selector
              }
            })*/
          ]
        }
      }),
      {
        name: 'log-rebuild',
        setup(build) {
          build.onEnd(() => {
            console.log(`Rebuild - ${new Date().toLocaleString()}`)
          })
        },
      }
    ]
  }

  if (argv.watch) {
    const ctx = await esbuild.context(options)
    await ctx.watch()
  } else {
    const result = await esbuild.build({
      ...options,
      metafile: true
    })

    // save bundle to analyze here https://esbuild.github.io/analyze/
    fs.writeFileSync(path.join(outdir, 'meta.json'), JSON.stringify(result.metafile))
  }
}

main()
