import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET() {
  try {
    const payload = await getPayload({ config })
    
    // Find Test Image post
    const found = await payload.find({
      collection: 'posts',
      where: { title: { equals: 'Test Image' } },
      limit: 1,
    })
    
    if (!found.docs[0]) {
      return NextResponse.json({ success: false, error: 'Test Image cikk nem található! Címe pontosan "Test Image" legyen!' })
    }
    
    const post = found.docs[0] as any
    
    return NextResponse.json({
      success: true,
      title: post.title,
      content: post.content,
      contentString: JSON.stringify(post.content, null, 2).substring(0, 5000),
      contentType: typeof post.content,
      contentKeys: post.content ? Object.keys(post.content) : [],
      rootChildren: post.content?.root?.children?.slice(0, 3),
      firstChildSample: post.content?.root?.children?.[0],
      uploadNodeSample: post.content?.root?.children?.find((c: any) => c.type === 'upload'),
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message, stack: err.stack?.substring(0, 3000) }, { status: 500 })
  }
}

