
import { documentService } from "./document";
import { configService } from "./config";
import { attributeService } from "./attribute";
import { fileService } from "./file";
import { authService } from './auth'
import { fsServer } from "./fs";

const init = () => {
  fsServer.requestRoot()
}

export { documentService, configService, attributeService, fileService, authService, init }