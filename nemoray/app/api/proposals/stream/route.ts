import type { ProposalCameraEvent } from '@/lib/agent/proposalEventBus';
import { LONDON_DEAD_ZONES } from '@/lib/data/mockSionna';
import { generateProposals } from '@/lib/data/mockProposals';

function encode(event: ProposalCameraEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export async function GET() {
  const proposals = generateProposals(LONDON_DEAD_ZONES);

  const events: ProposalCameraEvent[] = [
    ...proposals.map(p => ({
      type: p.accepted ? ('accepted' as const) : ('rejected' as const),
      proposal: { lat: p.lat, lng: p.lng },
    })),
    { type: 'overview' as const },
  ];

  let timer: ReturnType<typeof setTimeout>;

  const stream = new ReadableStream<string>({
    start(controller) {
      let i = 0;

      function next() {
        if (i >= events.length) {
          controller.close();
          return;
        }
        controller.enqueue(encode(events[i++]));
        timer = setTimeout(next, 3000);
      }

      timer = setTimeout(next, 2000);
    },
    cancel() {
      clearTimeout(timer);
    },
  });

  return new Response(stream as unknown as BodyInit, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
