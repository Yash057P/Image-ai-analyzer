import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
} from "amazon-cognito-identity-js";
import { cognitoConfig } from "./cognitoConfig";

const userPool = new CognitoUserPool({
  UserPoolId: cognitoConfig.UserPoolId,
  ClientId: cognitoConfig.ClientId,
});

// SIGNUP
export const signUp = (email, password) => {
  return new Promise((resolve, reject) => {
    userPool.signUp(email, password, [], null, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

// LOGIN (ACCESS TOKEN)
export const login = (email, password) => {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    const authDetails = new AuthenticationDetails({
      Username: email,
      Password: password,
    });

    user.authenticateUser(authDetails, {
      onSuccess: (session) => {
        const token = session.getAccessToken().getJwtToken();
        localStorage.setItem("token", token);
        resolve(token);
      },
      onFailure: (err) => reject(err),
    });
  });
};

// CONFIRM USER
export const confirmUser = (email, code) => {
  const user = new CognitoUser({
    Username: email,
    Pool: userPool,
  });

  return new Promise((resolve, reject) => {
    user.confirmRegistration(code, true, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};