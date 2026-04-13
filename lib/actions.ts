'use server';

import { resend } from './resend';

export async function sendOrderEmail(customerEmail: string, orderId: string) {
  try {
    await resend.emails.send({
      from: 'Japanshop <volodymyr@send.tokyotelservice.com>',
      to: [customerEmail],
      subject: `Підтвердження замовлення №${orderId}`,
      html: `
        <h1>Дякуємо за замовлення в Japanshop!</h1>
        <p>Ваше замовлення №${orderId} успішно оформлено.</p>
        <p>Honne (本音): Система працює стабільно.</p>
      `,
    });
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}