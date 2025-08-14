{ pkgs, ... }: {
  channel = "stable-23.11";
  packages = [ pkgs.nodejs_20 ];

  env = { };

  idx = {
    extensions = [
      "dbaeumer.vscode-eslint"
      "esbenp.prettier-vscode"
      "bradlc.vscode-tailwindcss"
    ];

    # ✅ Configurazione preview conforme
    previews = {
      enable = true;
      previews = {
        web = {
          command = [ "npm" "run" "dev" ];   # lista di stringhe
          manager = "web";
          # facoltativo: se il tuo dev server richiede PORT esplicita
          env = { PORT = "5173"; };
          # facoltativo: se l'app non è in root
          # cwd = "apps/web";
        };
      };
    };

    # Consigliato: install dipendenze alla prima apertura
    workspace.onCreate = {
      "npm-install" = "npm install";
    };
  };
}
