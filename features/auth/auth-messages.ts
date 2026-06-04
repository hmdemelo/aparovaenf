export function authCallbackErrorMessage(reason: string | null | undefined) {
  switch (reason) {
    case 'missing_code':
    case 'invalid_link':
      return 'Esse link expirou ou já foi usado. Peça um novo link de acesso.'
    case 'provider_error':
      return 'Não foi possível concluir o login com o provedor escolhido.'
    case 'session_missing':
      return 'Não conseguimos validar sua sessão. Tente entrar novamente.'
    default:
      return null
  }
}

export function authRequestErrorMessage(message: string | undefined) {
  const normalized = message?.toLowerCase() ?? ''
  if (normalized.includes('rate') || normalized.includes('too many')) {
    return 'Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.'
  }
  return 'Não foi possível enviar o link agora. Confira o e-mail e tente novamente.'
}
