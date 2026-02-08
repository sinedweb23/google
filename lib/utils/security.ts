/**
 * Utilitários de Segurança
 * 
 * Funções para hash de CPF, validações, rate limiting, etc.
 */

import crypto from 'crypto';
import bcrypt from 'bcryptjs';

/**
 * Gera hash SHA-256 do CPF (LGPD compliance)
 * Nunca armazenamos CPF em texto plano
 */
export function hashCPF(cpf: string): string {
  // Remove caracteres não numéricos
  const cpfLimpo = cpf.replace(/\D/g, '');
  
  if (cpfLimpo.length !== 11) {
    throw new Error('CPF deve conter 11 dígitos');
  }
  
  // Gera hash SHA-256
  return crypto.createHash('sha256').update(cpfLimpo).digest('hex');
}

/**
 * Valida formato de CPF
 */
export function validarCPF(cpf: string): boolean {
  const cpfLimpo = cpf.replace(/\D/g, '');
  
  if (cpfLimpo.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpfLimpo)) return false; // Todos os dígitos iguais
  
  // Validação dos dígitos verificadores
  let soma = 0;
  let resto;
  
  for (let i = 1; i <= 9; i++) {
    soma += parseInt(cpfLimpo.substring(i - 1, i)) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpfLimpo.substring(9, 10))) return false;
  
  soma = 0;
  for (let i = 1; i <= 10; i++) {
    soma += parseInt(cpfLimpo.substring(i - 1, i)) * (12 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpfLimpo.substring(10, 11))) return false;
  
  return true;
}

/**
 * Mascara CPF para exibição (XXX.XXX.XXX-XX)
 */
export function mascararCPF(cpf: string): string {
  const cpfLimpo = cpf.replace(/\D/g, '');
  if (cpfLimpo.length !== 11) return cpf;
  return cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Valida formato de email
 */
export function validarEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Valida formato de celular brasileiro
 */
export function validarCelular(celular: string): boolean {
  const celularLimpo = celular.replace(/\D/g, '');
  // Aceita formato: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
  return celularLimpo.length >= 10 && celularLimpo.length <= 11;
}

/**
 * Normaliza celular (remove caracteres não numéricos)
 */
export function normalizarCelular(celular: string): string {
  return celular.replace(/\D/g, '');
}

/**
 * Gera senha temporária forte
 */
export function gerarSenhaTemporaria(): string {
  const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
  let senha = '';
  
  // Garante pelo menos uma letra maiúscula, minúscula, número e caractere especial
  senha += 'ABCDEFGHJKLMNPQRSTUVWXYZ'[Math.floor(Math.random() * 24)];
  senha += 'abcdefghijkmnpqrstuvwxyz'[Math.floor(Math.random() * 24)];
  senha += '23456789'[Math.floor(Math.random() * 8)];
  senha += '!@#$%&*'[Math.floor(Math.random() * 7)];
  
  // Completa até 12 caracteres
  for (let i = senha.length; i < 12; i++) {
    senha += caracteres[Math.floor(Math.random() * caracteres.length)];
  }
  
  // Embaralha os caracteres
  return senha.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Gera código OTP de 6 dígitos
 */
export function gerarOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Hash de senha usando bcrypt
 */
export async function hashSenha(senha: string): Promise<string> {
  return bcrypt.hash(senha, 10);
}

/**
 * Valida senha com hash
 */
export async function validarSenha(senha: string, hash: string): Promise<boolean> {
  return bcrypt.compare(senha, hash);
}

/**
 * Extrai IP do request (considera proxies)
 */
export function extrairIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

/**
 * Sanitiza string para prevenir XSS
 */
export function sanitizarString(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, 1000); // Limite de tamanho
}
