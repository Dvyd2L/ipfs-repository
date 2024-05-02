import multer from 'multer'
import express from 'express'

const PORT = 3000

const hashMap = new Map(),
    storage = multer.memoryStorage(),
    upload = multer({ storage }),
    app = express();

class GatewayIPFS {
    /** 
     * @private 
     * @readonly
     * @type {HeliaLibp2p<Libp2p<DefaultLibp2pServices>>}
     */
    static #helia
    /** 
     * @private 
     * @readonly
     * @type {UnixFS}
     */
    static #fs

    static createNodeIPFS = async () => {
        if (!helia || !fs) {
            const { createHelia } = await import('helia'),
                { unixfs } = await import('@helia/unixfs')

            this.#helia = await createHelia() // create a Helia node
            this.#fs = unixfs(helia) // create a filesystem on top of Helia, in this case it's UnixFS
        }
        return { helia: this.#helia, fs: this.#fs }
    }
}

app.use(express.json())

app.get('/', async (req, res) => res.status(200).json({ message: 'server on' }))
app.post('/ipfs/upload', upload.single('file'), async (req, res) => {
    const { file } = req
    try {
        const { helia, fs } = await GatewayIPFS.createNodeIPFS(),
            readStream = fs.createReadStream(file.path), // para files creo que no procede
            cid = await fs.addBytes(readStream, helia.blockstore)
        hashMap.set(file.originalname, cid)
        res.status(201).json({ message: 'Created' })
    } catch (error) {
        res.status(400).json({ message: 'Bad Request' })
    }
})
app.get('/ipfs/fetch', async (req, res) => {
    const { filename } = req.body
    try {
        !hashMap.has(filename) && (() => { throw new Error() })()
        const { helia, fs } = await GatewayIPFS.createNodeIPFS(),
            cid = hashMap.get(filename),
            readStream = fs.cat(cid)
        readStream.pipe(res)
    } catch (error) {
        res.status(404).json({ message: 'Not Found' })
    }
})
app.listen(PORT, () => console.info(`Server listen on port: ${PORT}`))
