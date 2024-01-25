/* eslint-disable prettier/prettier */
import { MailerService } from '@nestjs-modules/mailer'
import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { EmailDto } from './email.dto';
@ApiTags('EMAIL')
@Controller('email')
export class EmailController {
    constructor(private mailService: MailerService) { }
    @Post()
    @ApiOperation({ summary: 'ENVIAR EMAIL' })
    @ApiBody({ type: EmailDto })
    async sendUserEmail(@Body() body: EmailDto) {
        const { name, username, cpf, phone, message } = body;

        const titleContent = `Suporte - Entre em Contato`;

        const htmlContent = `
        <p>Mensagem do usuário ${name} com o seguinte conteúdo:</p>
        <p><strong>Informações do Usuário:</strong></p>
        <ul>
            <li><strong>Nome:</strong> ${name}</li>
            <li><strong>Email:</strong> ${username}</li>
            <li><strong>CPF:</strong> ${cpf}</li>
            <li><strong>Telefone:</strong> ${phone}</li>
        </ul>
        <p><strong>Mensagem do Usuário:</strong></p>
        <p style="text-align: justify;">${message}</p>
        `;

        return await this.mailService.sendMail({
            to: process.env.SENDER_EMAIL,
            from: process.env.SENDER_EMAIL,
            subject: titleContent,
            html: htmlContent
        });
    }
}