/**
 * ip地址 请求协议类型检查
 * @type {RegExp}
 */
import axios from "axios";
let API = "";
let ip = "";
let JDPWebApi = "";
let MAPURL = "";
// if (process.env.NODE_ENV === "production") {
//   API = "/api";
//   ip = window.location.host;
// } else {
//   API = "http://localhost:8080/api";
//   ip = "localhost:8080";
// }

let customConfig = {};

export {
  API,
  MAPURL,
  JDPWebApi,
  ip,
  customConfig,
};