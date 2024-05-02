
/**
 * 
 * @param {string[]} textContents 
 */
async function main(textContents) {
    const helia = await createHelia(), // create a Helia node
        fs = unixfs(helia), // create a filesystem on top of Helia, in this case it's UnixFS
        encoder = new TextEncoder(), // turn strings into Uint8Arrays
        decoder = new TextDecoder() // turn Uint8Arrays into strings

    console.table([{
        helia: helia,
        libp2p: helia.libp2p,
        peerId: helia.libp2p.peerId, // Our node's PeerId
    }])

    while (true) {
        const results = await Promise.all(textContents.map(async textContent => {
            const cid = await fs.addBytes(encoder.encode(textContent, {
                onProgress: (evt) =>
                    console.table([{
                        'add event type': evt.type,
                        'add event detail': evt.detail
                    }])
            }), helia.blockstore), // add the bytes to your node and receive a unique content identifier
                content = []

            for await (const chunk of fs.cat(cid, {
                onProgress: (evt) =>
                    console.table([{
                        'cat event type': evt.type,
                        'cat event detail': evt.detail
                    }])
            })) {
                content.push(decoder.decode(chunk, { stream: true }))
            }

            return {
                file: cid.toString(), // Added file
                content: content.join(''), // Added file contents
            }
        }));

        console.table(results)

        // Esperar un tiempo antes de verificar nuevas operaciones
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

main('Probando helia para montar un servidor IPFS'.split(' ')).catch(err => {
    console.error(err)
    process.exit(1)
})
