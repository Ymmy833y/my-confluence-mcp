"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createConfluenceGateway = createConfluenceGateway;
const cloudConfluenceClient_1 = require("./adapters/cloud/cloudConfluenceClient");
const cloudGateway_1 = require("./adapters/cloud/cloudGateway");
const onpremConfluenceClient_1 = require("./adapters/onprem/onpremConfluenceClient");
const onpremGateway_1 = require("./adapters/onprem/onpremGateway");
function createConfluenceGateway(cfg) {
    if (cfg.hosting === "cloud") {
        const client = new cloudConfluenceClient_1.CloudConfluenceClient(cfg);
        return new cloudGateway_1.CloudGateway(client, cfg.baseUrl);
    }
    // onprem
    const client = new onpremConfluenceClient_1.OnPremConfluenceClient(cfg);
    return new onpremGateway_1.OnPremGateway(client, cfg.baseUrl);
}
