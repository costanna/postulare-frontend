export function fakeJwt(expInSeconds: number): string {
  const encode = (value: object) => btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${encode({ alg: 'HS256' })}.${encode({ sub: 'u1', exp: Math.floor(Date.now() / 1000) + expInSeconds })}.signature`;
}
