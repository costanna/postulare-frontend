import { fakeJwt } from './fake-jwt.testing';
import { isExpiringSoon } from './jwt';

describe('isExpiringSoon', () => {
  it('is false for a token with plenty of time left', () => {
    expect(isExpiringSoon(fakeJwt(600))).toBeFalse();
  });

  it('is true when it expires within the margin', () => {
    expect(isExpiringSoon(fakeJwt(10))).toBeTrue();
    expect(isExpiringSoon(fakeJwt(45), 60)).toBeTrue();
  });

  it('is true for a token that already expired', () => {
    expect(isExpiringSoon(fakeJwt(-5))).toBeTrue();
  });

  it('treats unreadable tokens as valid and leaves the decision to the server', () => {
    expect(isExpiringSoon('not-a-jwt')).toBeFalse();
    expect(isExpiringSoon('a.%%%.c')).toBeFalse();
    expect(isExpiringSoon('')).toBeFalse();
  });
});
