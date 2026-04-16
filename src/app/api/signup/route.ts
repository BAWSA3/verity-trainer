import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: NextRequest) {
  try {
    const { email, xHandle, trainerName, trainerConfig } = await req.json();

    if (!email || !trainerName || !trainerConfig) {
      return NextResponse.json({ error: 'MISSING REQUIRED FIELDS' }, { status: 400 });
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'INVALID EMAIL FORMAT' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('trainer_signups')
      .upsert(
        {
          email: email.toLowerCase().trim(),
          x_handle: xHandle?.toLowerCase().trim() || null,
          trainer_name: trainerName.toUpperCase().slice(0, 12),
          trainer_config: trainerConfig,
        },
        { onConflict: 'email' }
      )
      .select('id')
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'SIGNUP FAILED' }, { status: 500 });
    }

    return NextResponse.json({ id: data.id });
  } catch {
    return NextResponse.json({ error: 'SYSTEM ERROR' }, { status: 500 });
  }
}
