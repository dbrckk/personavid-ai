import { NextResponse } from 'next/server';
import { buildFinalCommand } from '@/lib/pipeline-orchestrator';

export async function POST(req: Request) {
  try {
    const project = await req.json();
    const command = buildFinalCommand(project);

    // ICI : On envoie la commande à un worker externe (Shotstack ou Cloudinary)
    // car un serveur Web classique couperait la connexion avant la fin du rendu.
    console.log(`[CORE] Executing: ${command.command}`);

    return NextResponse.json({ 
      status: 'QUEUED', 
      jobId: Buffer.from(Date.now().toString()).toString('base64') 
    });
  } catch (error) {
    return NextResponse.json({ status: 'ERROR', message: 'Rupture système' }, { status: 500 });
  }
}
