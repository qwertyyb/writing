// import { documentService } from './backend/document'
// import { configService } from './backend/config'

// export { documentService, configService }

import { documentService } from "./indexeddb/document";
import { configService } from "./indexeddb/config";
import { attributeService } from "./indexeddb/attribute";
import { fileService } from "./indexeddb/file";

export { documentService, configService, attributeService, fileService }