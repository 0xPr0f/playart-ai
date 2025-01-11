import clientPromise from '@/app/lib/mongoclient'

export default async function handler(req, res) {
  try {
    const client = await clientPromise
    const db = client.db('Play_Art_Data')
    const collection = db.collection('ArtTestData')
    const data = await collection.insertOne(req.body)
    res.status(200).json({ success: true, data })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, error: 'Failed to fetch data' })
  }
}
