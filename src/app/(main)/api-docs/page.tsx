"use client";

import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-white">
      <SwaggerUI
        url="/api/openapi.json"
        docExpansion="list"
        defaultModelsExpandDepth={1}
        tryItOutEnabled={true}
        persistAuthorization={true}
        requestInterceptor={(req) => {
          // Include cookies so session-authenticated endpoints work from the docs UI
          req.credentials = "include";
          return req;
        }}
      />
    </div>
  );
}
