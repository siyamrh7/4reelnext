import { NextResponse } from 'next/server';
import { z } from 'zod';
import { dbConnect } from '@/lib/db';
import { Question } from '@/lib/models';
import { sendQuestionMails } from '@/lib/mailer';
import { fireWebhook } from '@/lib/webhook';
import { bookingRateLimit, clientIp } from '@/lib/rateLimit';

const QuestionInputSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().max(40).optional().default(''),
  company: z.string().max(120).optional().default(''),
  message: z.string().min(2).max(2000),
});

/** POST /api/question — non-booking enquiry */
export async function POST(request) {
  if (!bookingRateLimit(clientIp(request))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = QuestionInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }
  const q = parsed.data;

  await dbConnect();
  const doc = await Question.create(q);

  await sendQuestionMails(q);
  await fireWebhook('question.created', doc.toObject());

  return NextResponse.json({ ok: true, id: doc._id });
}
