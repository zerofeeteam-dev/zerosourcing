import { readE2EEnvironment } from "./environment";
import { createLocalServiceClient, findLocalE2EAdmin } from "./service-client";

export default async function globalTeardown(): Promise<void> {
  const environment = readE2EEnvironment();
  const client = createLocalServiceClient(environment);
  const user = await findLocalE2EAdmin(client);
  if (!user) return;

  const { error } = await client.auth.admin.deleteUser(user.id);
  if (error) throw error;
}
