import { readE2EEnvironment } from "./environment";
import {
  createLocalServiceClient,
  ensureLocalE2EAdmin,
} from "./service-client";

export default async function globalSetup(): Promise<void> {
  const environment = readE2EEnvironment();
  const client = createLocalServiceClient(environment);
  await ensureLocalE2EAdmin(client);
}
