export const validatePassword = (password) => {
    const length = password.length;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[^A-Za-z0-9]/.test(password);
  
    // 최소 10자리 이상 : 영어 대문자, 소문자, 숫자, 특수문자 중 2종류 문자 조합으로 구성
    if (length >= 10) {
      if ((hasUpperCase && hasLowerCase) ||
          (hasUpperCase && hasNumber) ||
          (hasUpperCase && hasSpecialChar) ||
          (hasLowerCase && hasNumber) ||
          (hasLowerCase && hasSpecialChar) ||
          (hasNumber && hasSpecialChar)) {
        return true;
      }
    }
  
    // 최소 8자리 이상 : 영어 대문자, 소문자, 숫자, 특수문자 중 3종류 문자 조합으로 구성
    if (length >= 8) {
      if ((hasUpperCase && hasLowerCase && hasNumber) ||
          (hasUpperCase && hasLowerCase && hasSpecialChar) ||
          (hasUpperCase && hasNumber && hasSpecialChar) ||
          (hasLowerCase && hasNumber && hasSpecialChar)) {
        return true;
      }
    }
  
    return false;
  };