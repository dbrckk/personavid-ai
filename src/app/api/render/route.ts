import { NextResponse } from 'next/server';
import { generateNeuralScript } from '@/lib/ai-engine'; // Vérifie l'import

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    const config = await generateNeuralScript(prompt);
    
    // On renvoie un objet complet au frontend
    return NextResponse.json({ config });
  } catch (error) {
    return NextResponse.json({ error: "API_CRASH" }, { status: 500 });
  }
}
