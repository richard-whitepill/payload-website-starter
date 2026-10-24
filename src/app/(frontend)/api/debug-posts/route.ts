import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET() {
  try {
    const payload = await getPayload({ config })
    
    // Get one post to see its structure
    const posts = await payload.find({ collection: 'posts', limit: 1 })
    const post = posts.docs[0] as any

    // Try to get collection config
    const collections = (config as any).collections || []
    const postsCollection = collections.find((c: any) => c.slug === 'posts')
    const fields = postsCollection?.fields?.map((f: any) => ({
      name: f.name,
      type: f.type,
      fields: f.fields?.map((sf: any) => ({ name: sf.name, type: sf.type })),
    })) || []

    return NextResponse.json({
      success: true,
      postKeys: post ? Object.keys(post) : [],
      postSample: post ? {
        id: post.id,
        title: post.title,
        contentType: typeof post.content,
        contentIsArray: Array.isArray(post.content),
        contentKeys: post.content && typeof post.content === 'object' ? Object.keys(post.content).slice(0, 20) : null,
        contentSample: String(post.content || '').substring(0, 500),
        richTextType: typeof post.richText,
        richTextSample: String(JSON.stringify(post.richText || '')).substring(0, 1000),
        hasContent: !!post.content,
        hasRichText: !!post.richText,
        hasDescription: !!post.description,
        descriptionSample: String(post.description || '').substring(0, 500),
      } : null,
      collectionFields: fields,
      allFieldNames: fields.map((f: any) => f.name),
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message, stack: err.stack?.substring(0, 3000) }, { status: 500 })
  }
}

