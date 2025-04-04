declare namespace gapi {
  function load(name: string, callback: () => void): void;
  
  namespace client {
    function init(config: {
      apiKey: string;
      discoveryDocs?: string[];
    }): Promise<void>;
    function getToken(): { access_token: string } | null;
    function setToken(token: { access_token: string } | null): void;
    
    namespace sheets {
      namespace spreadsheets {
        function get(params: {
          spreadsheetId: string;
          fields?: string;
        }): Promise<{ result: { sheets: Array<{ properties?: { title?: string } }> } }>;
        
        namespace values {
          function get(params: {
            spreadsheetId: string;
            range: string;
          }): Promise<{ result: { values: any[][] } }>;
          
          function update(params: {
            spreadsheetId: string;
            range: string;
            valueInputOption: string;
            resource: { values: any[][] };
          }): Promise<any>;
          
          function append(params: {
            spreadsheetId: string;
            range: string;
            valueInputOption: string;
            resource: { values: any[][] };
          }): Promise<any>;
        }
      }
    }
    
    namespace drive {
      namespace files {
        function list(params: {
          q: string;
          fields: string;
          spaces: string;
        }): Promise<{ result: { files?: Array<{ id?: string; name?: string }> } }>;
      }
    }
  }
}

declare namespace google {
  namespace accounts {
    namespace oauth2 {
      function initTokenClient(config: {
        client_id: string;
        scope: string;
        callback: (response: { error?: string }) => void;
      }): {
        requestAccessToken: (params: { prompt: string }) => void;
        callback: (response: { error?: string }) => void;
      };
      function revoke(token: string): void;
    }
  }
} 