import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function DELETE(request: NextRequest) {
  try {
    const { donationId } = await request.json();

    if (!donationId) {
      return NextResponse.json(
        { error: 'Donation ID is required' },
        { status: 400 }
      );
    }

    console.log('Deleting donation:', donationId);

    // ลบข้อมูลจาก database
    const { error } = await supabaseAdmin
      .from('donations')
      .delete()
      .eq('id', donationId);

    if (error) {
      console.error('Delete error:', error);
      throw error;
    }

    console.log('Donation deleted successfully');

    return NextResponse.json({
      success: true,
      message: 'Donation deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting donation:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
