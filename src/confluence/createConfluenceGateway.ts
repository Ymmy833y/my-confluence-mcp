import { CloudConfluenceClient } from "@cloud/cloudConfluenceClient";
import { CloudGateway } from "@cloud/cloudGateway";
import { ConfluenceConfig } from "@config/confluenceConfig";
import { ConfluenceGateway } from "@core/confluenceGateway";
import { OnPremConfluenceClient } from "@onprem/onpremConfluenceClient";
import { OnPremGateway } from "@onprem/onpremGateway";

export function createConfluenceGateway(
  cfg: ConfluenceConfig,
): ConfluenceGateway {
  if (cfg.hosting === "cloud") {
    const client = new CloudConfluenceClient(cfg);
    return new CloudGateway(client, cfg.baseUrl);
  }

  // onprem
  const client = new OnPremConfluenceClient(cfg);
  return new OnPremGateway(client, cfg.baseUrl);
}
