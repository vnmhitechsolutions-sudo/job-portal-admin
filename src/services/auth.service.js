import axios from "api/api";

export const loginUser = async (payload) => {
  const { data } = await axios.post("/auth/login", payload);
  return data;
};
