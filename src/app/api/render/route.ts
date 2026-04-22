import { NextResponse } from 'next/server';
// Chemin relatif direct pour remonter à src/lib
import { buildFinalCommand } from '../../../lib/pipeline-orchestrator';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.script) {
      return NextResponse.json({ error: "Script manquant" }, { status: 400 });
    }

    // On prépare les données pour l'orchestrateur
    const project = {
      id: body.id || `gen_${Date.now()}`,
      script: body.script,
      voiceUrl: "pending", // Sera généré par ElevenLabs
      brollUrls: [],
      musicUrl: "default_pulse.mp3"
    };

    const renderData = buildFinalCommand(project);

    // Simulation de mise en queue (Production-Ready)
    console.log(`[CORE] Pipeline command ready for: ${project.id}`);
    
    return NextResponse.json({ 
      status: 'QUEUED', 
      command_preview: renderData.command,
      projectId: project.id 
    });

  } catch (error) {
    console.error("[FATAL] Render Route Error:", error);
    return NextResponse.json({ 
      status: 'ERROR', 
      message: 'Rupture de la logique de rendu' 
    }, { status: 500 });
  }
}
