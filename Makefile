CLIENT ?= claudio

CONFIG_FILE := config/clients/$(CLIENT).json

.PHONY: clients check generate-config deploy create-client

# Lista os clientes configurados
clients:
	@echo "Clientes disponíveis:"
	@for file in config/clients/*.json; do \
		client=$$(basename "$$file" .json); \
		echo "  - $$client"; \
	done

# Valida a configuração do cliente
check:
	@test -f "$(CONFIG_FILE)" || \
		(echo "❌ Cliente '$(CLIENT)' não encontrado em $(CONFIG_FILE)."; exit 1)

	@node -e "const fs=require('fs'); \
	const c=JSON.parse(fs.readFileSync('$(CONFIG_FILE)','utf8')); \
	if (!c.firebase?.projectId) throw new Error('Firebase projectId não configurado'); \
	if (!c.firebase?.apiKey) throw new Error('Firebase apiKey não configurado'); \
	if (!c.firebase?.appId) throw new Error('Firebase appId não configurado'); \
	if (!c.logo) throw new Error('Logo não configurado'); \
	if (!c.theme?.primary) throw new Error('Cor primary não configurada'); \
	console.log('✅ Cliente: $(CLIENT)'); \
	console.log('🔥 Firebase: ' + c.firebase.projectId); \
	console.log('🌐 Domínio: ' + (c.domain || 'não configurado')); \
	console.log('🖼️  Logo: ' + c.logo); \
	console.log('🎨 Tema: OK');"

# Gera o arquivo de configuração utilizado pela aplicação
generate-config: check
	@node -e "const fs=require('fs'); \
	const config=JSON.parse(fs.readFileSync('$(CONFIG_FILE)','utf8')); \
	fs.writeFileSync('config/client.js', \
	'const clientConfig = ' + JSON.stringify(config, null, 2) + ';\\n\\nexport default clientConfig;\\n');"
	@echo "✅ Configuração gerada para: $(CLIENT)"

# Faz o deploy utilizando o projectId salvo no JSON do cliente
deploy: generate-config
	@PROJECT_ID=$$(node -e "console.log(require('./$(CONFIG_FILE)').firebase.projectId)") && \
	echo "" && \
	echo "🚀 Deploy do cliente: $(CLIENT)" && \
	echo "🔥 Firebase: $$PROJECT_ID" && \
	echo "" && \
	firebase deploy \
		--project "$$PROJECT_ID" \
		--only hosting,firestore:rules,storage

# Cria um novo cliente a partir de um projeto Firebase já existente
create-client:
	@test -n "$(PROJECT_ID)" || \
		(echo "❌ PROJECT_ID não informado."; \
		echo "Uso: make create-client CLIENT=victor PROJECT_ID=projeto-victor-61cec"; \
		exit 1)

	@node scripts/create-client.js "$(CLIENT)" "$(PROJECT_ID)"

dev: generate-config
	@echo ""
	@echo "🚀 Ambiente preparado para desenvolvimento"
	@echo "👤 Cliente: $(CLIENT)"
	@echo "🔥 Firebase: $$(node -e "console.log(require('./$(CONFIG_FILE)').firebase.projectId)")"
	@echo ""
	@echo "Agora abra o projeto pelo Live Server do VS Code."