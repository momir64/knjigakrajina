import { Resend } from 'resend'
import type { OrderItem, OrderRow } from './db'
import { config } from './env'
import { newOrderNotice, orderConfirmation, statusUpdate, testMail, type Mail, type NotifiedStatus } from './mail-templates'

let client: Resend | undefined

async function send(to: string[], mail: Mail, replyTo?: string): Promise<boolean> {
  if (to.length === 0) return false
  if (!config.resendKey) {
    console.warn(`RESEND_API_KEY not set - email to ${to.join(', ')} not sent:\n${mail.subject}\n${mail.text}`)
    return false
  }
  client ??= new Resend(config.resendKey)
  const { error } = await client.emails.send({ from: config.mailFrom, to, subject: mail.subject, html: mail.html, text: mail.text, ...(replyTo && { replyTo }) })
  if (error) {
    console.error('Resend failed', error)
    return false
  }
  return true
}

/** Confirmation to the customer + notification to the shop; the order is already saved, so failures only get logged. */
export async function sendOrderEmails(order: OrderRow, items: OrderItem[], notify: string[]): Promise<void> {
  await send([order.email], orderConfirmation(order, items))
  await send(notify, newOrderNotice(order, items), order.email)
}

/** Back office: tells the customer that the order was shipped / canceled. */
export const sendStatusEmail = (order: OrderRow, items: OrderItem[], status: NotifiedStatus) => send([order.email], statusUpdate(order, items, status))

/** For the back office: checks that Resend is configured and the notification addresses work. */
export async function sendTestEmail(to: string[]): Promise<'sent' | 'no-key' | 'failed' | 'no-recipients'> {
  if (to.length === 0) return 'no-recipients'
  if (!config.resendKey) return 'no-key'
  return (await send(to, testMail())) ? 'sent' : 'failed'
}
