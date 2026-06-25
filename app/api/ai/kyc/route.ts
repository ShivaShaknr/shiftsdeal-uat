import { NextRequest, NextResponse } from 'next/server';
import { performKYCVerification, extractDocumentInfo } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const documentImage = formData.get('documentImage') as File;
    const documentType = formData.get('documentType') as string;
    const contactName = formData.get('contactName') as string;
    const organizationName = formData.get('organizationName') as string;

    if (!documentImage || !documentType || !contactName) {
      return NextResponse.json(
        { error: 'Document image, type, and contact name are required' },
        { status: 400 }
      );
    }

    // Convert image to base64
    const bytes = await documentImage.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString('base64');
    const mimeType = documentImage.type;

    // Extract text from document using vision AI
    const extractedInfo = await extractDocumentInfo(base64Image, mimeType, documentType);

    if (!extractedInfo) {
      return NextResponse.json(
        { error: 'Failed to extract document information' },
        { status: 400 }
      );
    }

    // Verify KYC
    const result = await performKYCVerification(
      JSON.stringify(extractedInfo),
      organizationName,
      contactName,
      documentType
    );

    return NextResponse.json({
      success: true,
      result: {
        ...result,
        extractedInfo,
      },
    });
  } catch (error: any) {
    console.error('KYC API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify KYC' },
      { status: 500 }
    );
  }
}
