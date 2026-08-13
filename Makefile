CLIENT ?= claudio

CONFIG_FILE := config/clients/$(CLIENT).json

clients:
	@echo "Clientes disponíveis:"
	@for file in config/clients/*.json; do \
		client=$$(basename "$$file" .json); \
		echo "  - $$client"; \
	done

check-client:
	@test -f "$(CONFIG_FILE)" || (echo "Cliente '$(CLIENT)' não encontrado."; exit 1)
	@echo "Cliente: $(CLIENT)"

generate-config: check-client
	@node -e "const fs=require('fs'); const config=JSON.parse(fs.readFileSync('$(CONFIG_FILE)','utf8')); fs.writeFileSync('config/client.js', 'const clientConfig = ' + JSON.stringify(config, null, 2) + ';\\n\\nexport default clientConfig;\\n');"
	@echo "Configuração gerada para: $(CLIENT)"

check: check-client
	@node -e "const fs=require('fs'); const c=JSON.parse(fs.readFileSync('$(CONFIG_FILE)','utf8')); \
	if (!c.firebase?.projectId) throw new Error('Firebase projectId não configurado'); \
	if (!c.logo) throw new Error('Logo não configurado'); \
	if (!c.theme?.primary) throw new Error('Cor primary não configurada'); \
	console.log('Firebase: OK'); \
	console.log('Domínio: ' + (c.domain || 'não configurado')); \
	console.log('Logo: ' + c.logo); \
	console.log('Tema: OK');"

use-firebase: generate-config
	@PROJECT_ID=$$(node -e "console.log(require('./$(CONFIG_FILE)').firebase.projectId)") && \
	DOMAIN=$$(node -e "console.log(require('./$(CONFIG_FILE)').domain || 'não configurado')") && \
	echo "Firebase: $$PROJECT_ID" && \
	echo "Domínio: $$DOMAIN" && \
	firebase use "$$PROJECT_ID"


deploy: check use-firebase
	@echo "Deploy do cliente: $(CLIENT)"
	firebase deploy --only hosting firestore:rules storage

create-client:
	@node scripts/create-client.js $(CLIENT)

