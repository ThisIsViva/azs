import fp from 'fastify-plugin';
import { DefaultAzureCredential } from '@azure/identity';
import { SearchClient } from '@azure/search-documents';
import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';

export type AzureClients = {
  credential: DefaultAzureCredential;
  search: SearchClient<unknown>;
  blobContainer: ContainerClient;
};

export default fp(
  async (fastify, opts) => {
    const config = fastify.config;

    // Use the current user identity to authenticate with Azure OpenAI, Cognitive Search and Blob Storage
    // (no secrets needed, just use 'az login' locally, and managed identity when deployed on Azure).
    // If you need to use keys, use separate AzureKeyCredential instances with the keys for each service
    const credential = new DefaultAzureCredential();

    // Set up Azure clients
    const searchClient = new SearchClient(
      `https://${config.azureSearchService}.search.windows.net`,
      config.azureSearchIndex,
      credential,
    );
    const blobServiceClient = new BlobServiceClient(
      `https://${config.azureStorageAccount}.blob.core.windows.net`,
      credential,
    );
    const blobContainerClient = blobServiceClient.getContainerClient(config.azureStorageContainer);

    fastify.decorate('azure', {
      credential,
      search: searchClient,
      blobContainer: blobContainerClient,
    });
  },
  {
    name: 'azure',
    dependencies: ['config'],
  },
);

// When using .decorate you have to specify added properties for Typescript
declare module 'fastify' {
  export interface FastifyInstance {
    azure: AzureClients;
  }
}
