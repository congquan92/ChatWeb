const login = (req, res) => {
    res.send("Login route");
};

const signUp = (req, res) => {
    res.send("Sign Up route");
};
const logout = (req, res) => {
    res.send("Logout route");
};

export { login, signUp, logout };
