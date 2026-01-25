import { CloudConfluenceClient } from "@cloud/cloudConfluenceClient";
import { CloudGateway } from "@cloud/cloudGateway";
import { ConfluenceConfig } from "@config/confluenceConfig";
import { ConfluenceGateway } from "@core/confluenceGateway";
import { OnPremConfluenceClient } from "@onprem/onpremConfluenceClient";
import { OnPremGateway } from "@onprem/onpremGateway";

/**
 * Confluence の提供形態に応じて適切な Gateway 実装を生成して返す
 *
 * @param cfg 接続先の設定を受け取る
 * @returns 設定に対応した ConfluenceGateway を返す
 */
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
