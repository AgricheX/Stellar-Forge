type Text = readonly [en: string, pt: string];

export type ForumLink =
	| { kind: 'forge'; panel?: string; step?: 'paint' | 'generate' | 'tweak' }
	| { kind: 'url'; url: string };

export type ForumTopic = {
	id: string;
	section: Text;
	title: Text;
	intro: Text;
	items: { title: Text; text: Text }[];
	tips?: Text[];
	link?: { label: Text; to: ForumLink };
};

const START: Text = ['Getting started', 'Começo'];
const PAINT: Text = ['Painting', 'Pintura'];
const MAP: Text = ['Generate and tweak', 'Gerar e ajustar'];
const SYSTEMS: Text = ['System Forge', 'System Forge'];
const SHARE: Text = ['Mod, export and saves', 'Mod, exportação e saves'];
const HELP: Text = ['Help', 'Ajuda'];

export const FORUM_TOPICS: ForumTopic[] = [
	{
		id: 'welcome',
		section: START,
		title: ['What is Stellar Forge', 'O que é o Stellar Forge'],
		intro: [
			'Stellar Forge makes custom galaxy maps for Stellaris. You paint where you want stars, the tool turns the painting into solar systems and hyperlanes, and you download a mod ready to play.',
			'O Stellar Forge cria mapas de galáxia personalizados pro Stellaris. Você pinta onde quer estrelas, a ferramenta transforma a pintura em sistemas solares e hiperpistas, e você baixa um mod pronto pra jogar.',
		],
		items: [
			{
				title: ['The 3 steps', 'As 3 etapas'],
				text: [
					'Paint: draw the shape of the galaxy. Generate: create stars, hyperlanes, spawns and nebulas. Tweak: fix details by hand. Then Export.',
					'Pintar: desenhe o formato da galáxia. Gerar: cria estrelas, hiperpistas, spawns e nebulosas. Ajustar: corrige detalhes à mão. Depois é só Exportar.',
				],
			},
			{
				title: ['Saving', 'Salvamento'],
				text: [
					'Everything saves by itself in this browser. Use Project → Export JSON or export the mod to keep a copy somewhere else.',
					'Tudo é salvo sozinho neste navegador. Use Projeto → Exportar JSON ou exporte o mod pra guardar uma cópia em outro lugar.',
				],
			},
			{
				title: ['Projects', 'Projetos'],
				text: [
					'The Project menu creates, opens, renames, clones and deletes projects. Each project is one galaxy.',
					'O menu Projeto cria, abre, renomeia, clona e exclui projetos. Cada projeto é uma galáxia.',
				],
			},
			{
				title: ['Free', 'Gratuito'],
				text: [
					'Stellar Forge is completely free, made by fans for fans. If anyone asks for money to use it, it is a scam.',
					'O Stellar Forge é totalmente gratuito, feito de fã pra fã. Se alguém pedir dinheiro pra usar, é golpe.',
				],
			},
		],
		tips: [
			[
				'In a hurry? Open the Forge, click Milky Way or Random Galaxy on the welcome card and then Export.',
				'Com pressa? Abra o Forge, clique em Via Láctea ou Galáxia Aleatória no cartão de boas-vindas e depois em Exportar.',
			],
		],
		link: { label: ['Open the Forge', 'Abrir o Forge'], to: { kind: 'forge' } },
	},
	{
		id: 'install',
		section: START,
		title: ['Installing your map', 'Instalando seu mapa'],
		intro: [
			'Maps made here run on top of the Paint a Galaxy mod by Michael Moore. You need it enabled in the launcher.',
			'Os mapas feitos aqui rodam em cima do mod Paint a Galaxy, de Michael Moore. Ele precisa estar ativo no launcher.',
		],
		items: [
			{
				title: [
					'1. Subscribe to Paint a Galaxy',
					'1. Inscreva-se no Paint a Galaxy',
				],
				text: [
					'Open its page on the Steam Workshop and subscribe. It is free.',
					'Abra a página dele na Oficina da Steam e se inscreva. É grátis.',
				],
			},
			{
				title: ['2. Extract the zip', '2. Extraia o zip'],
				text: [
					'Extract the downloaded zip into Documents/Paradox Interactive/Stellaris/mod. You should see a .mod file and a folder with the same name side by side.',
					'Extraia o zip baixado em Documentos/Paradox Interactive/Stellaris/mod. Deve aparecer um arquivo .mod e uma pasta com o mesmo nome lado a lado.',
				],
			},
			{
				title: ['3. Enable both mods', '3. Ative os dois mods'],
				text: [
					'In the launcher, add Paint a Galaxy and your new mod to the playset. Your mod should load after Paint a Galaxy.',
					'No launcher, coloque o Paint a Galaxy e o seu mod novo no playset. O seu mod deve carregar depois do Paint a Galaxy.',
				],
			},
			{
				title: ['4. Pick your galaxy', '4. Escolha sua galáxia'],
				text: [
					'Start a new game, choose the Elliptical shape and pick your galaxy by its name in the size list.',
					'Comece um jogo novo, escolha o formato Elliptical e selecione sua galáxia pelo nome na lista de tamanhos.',
				],
			},
		],
		tips: [
			[
				'Maps with more than 1700 stars need a star names mod such as Just Star Names.',
				'Mapas com mais de 1700 estrelas precisam de um mod de nomes de estrelas, como o Just Star Names.',
			],
		],
		link: {
			label: ['Paint a Galaxy on Steam', 'Paint a Galaxy na Steam'],
			to: {
				kind: 'url',
				url: 'https://steamcommunity.com/sharedfiles/filedetails/?id=3532904115',
			},
		},
	},
	{
		id: 'interface',
		section: START,
		title: ['Finding your way around', 'Conhecendo a tela'],
		intro: [
			'The Forge has the map in the middle, the tools on the left and the settings of the current step on the right.',
			'O Forge tem o mapa no meio, as ferramentas na esquerda e as configurações da etapa atual na direita.',
		],
		items: [
			{
				title: ['Tool rail', 'Barra de ferramentas'],
				text: [
					'The left bar holds the tools of the current step plus Text, Random Galaxy, System Forge, undo, redo and Layers.',
					'A barra da esquerda tem as ferramentas da etapa atual e também Texto, Galáxia Aleatória, System Forge, desfazer, refazer e Camadas.',
				],
			},
			{
				title: ['Camera', 'Câmera'],
				text: [
					'Mouse wheel zooms. Hold Space and drag, or use W A S D and the arrows, to move around. 0 resets the view.',
					'A roda do mouse dá zoom. Segure Espaço e arraste, ou use W A S D e as setas, pra se mover. 0 volta a visão ao normal.',
				],
			},
			{
				title: ['Simple and Advanced mode', 'Modo simples e avançado'],
				text: [
					'The Forge starts in simple mode and hides the expert settings. Turn on View → Advanced mode to see everything.',
					'O Forge começa no modo simples e esconde as configurações de especialista. Ative Ver → Modo avançado pra ver tudo.',
				],
			},
			{
				title: ['Undo', 'Desfazer'],
				text: [
					'Ctrl+Z undoes and Ctrl+Y redoes. It works for painting, systems and System Forge designs.',
					'Ctrl+Z desfaz e Ctrl+Y refaz. Funciona pra pintura, sistemas e projetos do System Forge.',
				],
			},
		],
		link: { label: ['Open the Forge', 'Abrir o Forge'], to: { kind: 'forge' } },
	},
	{
		id: 'brushes',
		section: PAINT,
		title: ['Brushes and shapes', 'Pincéis e formas'],
		intro: [
			'The painting is a density map: white areas get many stars, dark areas few or none.',
			'A pintura é um mapa de densidade: áreas brancas recebem muitas estrelas, áreas escuras poucas ou nenhuma.',
		],
		items: [
			{
				title: ['Tools', 'Ferramentas'],
				text: [
					'Freehand (B), circle (C), ellipse (E), rectangle (R), line (L), polygon (G), star (K), ring (O) and spiral (Q).',
					'Mão livre (B), círculo (C), elipse (E), retângulo (R), linha (L), polígono (G), estrela (K), anel (O) e espiral (Q).',
				],
			},
			{
				title: ['Paint and erase', 'Pintar e apagar'],
				text: [
					'Click and drag to paint. Hold Shift to use the eraser version of the same tool. X swaps them.',
					'Clique e arraste pra pintar. Segure Shift pra usar a versão borracha da mesma ferramenta. X troca as duas.',
				],
			},
			{
				title: ['Size, strength and blur', 'Tamanho, força e desfoque'],
				text: [
					'Size changes the brush width ([ and ] also work). Strength is how bright each stroke is. Blur softens the edges.',
					'Tamanho muda a largura do pincel ([ e ] também funcionam). Força é o quanto cada traço clareia. Desfoque suaviza as bordas.',
				],
			},
			{
				title: ['Image upload', 'Enviar imagem'],
				text: [
					'Edit → Upload Image turns any picture into a painting. Bright parts become dense star areas.',
					'Editar → Enviar Imagem transforma qualquer imagem em pintura. As partes claras viram áreas cheias de estrelas.',
				],
			},
		],
		link: {
			label: ['Start painting', 'Começar a pintar'],
			to: { kind: 'forge', step: 'paint' },
		},
	},
	{
		id: 'text',
		section: PAINT,
		title: ['Text, numbers and emoji', 'Texto, números e emoji'],
		intro: [
			'Type anything and it becomes a galaxy in that shape: a letter, a word, your name, a number or an emoji.',
			'Digite qualquer coisa e ela vira uma galáxia nesse formato: uma letra, uma palavra, seu nome, um número ou um emoji.',
		],
		items: [
			{
				title: ['Typing', 'Digitando'],
				text: [
					'Press T or use the Text & Emoji section of the Paint step. Pick a font, bold, outline, spacing and line height.',
					'Aperte T ou use a seção Texto e Emoji da etapa Pintar. Escolha fonte, negrito, contorno, espaçamento e altura da linha.',
				],
			},
			{
				title: ['Transform box', 'Caixa de transformação'],
				text: [
					'Drag the box to move it, the corners to resize and the round handle to rotate. Shift keeps the proportion and snaps the rotation. You can also type X, Y, W, H and the angle.',
					'Arraste a caixa pra mover, os cantos pra redimensionar e a alça redonda pra girar. Shift mantém a proporção e encaixa a rotação. Também dá pra digitar X, Y, L, A e o ângulo.',
				],
			},
			{
				title: ['Apply', 'Aplicar'],
				text: [
					'Enter applies and Esc cancels. Apply & Generate also creates the stars right away.',
					'Enter aplica e Esc cancela. Aplicar e Gerar já cria as estrelas na hora.',
				],
			},
		],
		tips: [
			[
				'Bold fonts with thick letters make galaxies that are easier to travel.',
				'Fontes em negrito com letras grossas fazem galáxias mais fáceis de percorrer.',
			],
		],
		link: {
			label: ['Try it', 'Experimentar'],
			to: { kind: 'forge', step: 'paint' },
		},
	},
	{
		id: 'templates',
		section: PAINT,
		title: ['Templates and random galaxies', 'Modelos e galáxias aleatórias'],
		intro: [
			'Start from a real or fictional galaxy, or let chance decide.',
			'Comece de uma galáxia real ou da ficção, ou deixe a sorte decidir.',
		],
		items: [
			{
				title: ['Templates', 'Modelos'],
				text: [
					'Milky Way, Andromeda, Whirlpool, Cartwheel, Magellanic Clouds and maps inspired by Star Wars, Star Trek, Warhammer 40k, Mass Effect, Halo and Dune. They are placed with a transform box.',
					'Via Láctea, Andrômeda, Rodamoinho, Roda de Carro, Nuvens de Magalhães e mapas inspirados em Star Wars, Star Trek, Warhammer 40k, Mass Effect, Halo e Duna. Eles entram com uma caixa de transformação.',
				],
			},
			{
				title: ['Random galaxy', 'Galáxia aleatória'],
				text: [
					'The dice button forges a whole galaxy from a seed. The same seed always gives the same map, so you can share it.',
					'O botão de dado forja uma galáxia inteira a partir de uma semente. A mesma semente sempre gera o mesmo mapa, então dá pra compartilhar.',
				],
			},
		],
		link: {
			label: ['Roll a galaxy', 'Sortear uma galáxia'],
			to: { kind: 'forge', panel: 'random' },
		},
	},
	{
		id: 'commands',
		section: PAINT,
		title: ['Command bar', 'Barra de comandos'],
		intro: [
			'Ctrl+K opens the command bar. Type what you want in English or Portuguese.',
			'Ctrl+K abre a barra de comandos. Digite o que quer em inglês ou português.',
		],
		items: [
			{
				title: ['Examples', 'Exemplos'],
				text: [
					'spiral arms=3 stars=800 · preset milky way · text "HELLO" · random seed=nebula-42 · clear · generate',
					'espiral bracos=3 estrelas=800 · modelo via lactea · texto "OLÁ" · aleatoria semente=nebula-42 · limpar · gerar',
				],
			},
			{
				title: ['Values', 'Valores'],
				text: [
					'Use key=value. Percentages work (core=15%). x and y start at the center of the map. stars=N generates right away.',
					'Use chave=valor. Porcentagens funcionam (nucleo=15%). x e y começam no centro do mapa. estrelas=N já gera na hora.',
				],
			},
		],
		link: {
			label: ['Open the command bar', 'Abrir a barra de comandos'],
			to: { kind: 'forge', panel: 'command' },
		},
	},
	{
		id: 'generate',
		section: MAP,
		title: [
			'Generating stars and hyperlanes',
			'Gerando estrelas e hiperpistas',
		],
		intro: [
			'The Generate step turns the painting into the actual map. Each part has its own button, or use Generate All (Ctrl+G).',
			'A etapa Gerar transforma a pintura no mapa de verdade. Cada parte tem seu botão, ou use Gerar Tudo (Ctrl+G).',
		],
		items: [
			{
				title: ['Number of systems', 'Número de sistemas'],
				text: [
					'How many stars you want. If the painted area is too small, fewer stars fit.',
					'Quantas estrelas você quer. Se a área pintada for pequena demais, cabem menos.',
				],
			},
			{
				title: ['Hyperlanes', 'Hiperpistas'],
				text: [
					'Systems are grouped in clusters. Connectivity controls how many extra lanes appear inside and between clusters. Max Distance removes lanes that are too long.',
					'Os sistemas são agrupados em aglomerados. A conectividade controla quantas pistas extras aparecem dentro e entre aglomerados. Distância Máxima remove pistas longas demais.',
				],
			},
			{
				title: ['Spawns and nebulas', 'Spawns e nebulosas'],
				text: [
					'Spawns are where empires can start. Nebulas are placed randomly in the sizes you choose.',
					'Spawns são onde os impérios podem começar. As nebulosas são colocadas aleatoriamente nos tamanhos que você escolher.',
				],
			},
		],
		link: {
			label: ['Go to Generate', 'Ir pra Gerar'],
			to: { kind: 'forge', step: 'generate' },
		},
	},
	{
		id: 'tweak',
		section: MAP,
		title: ['Editing by hand', 'Editando à mão'],
		intro: [
			'The Tweak step has tools to fix anything the generator did.',
			'A etapa Ajustar tem ferramentas pra corrigir qualquer coisa que o gerador fez.',
		],
		items: [
			{
				title: ['Systems', 'Sistemas'],
				text: [
					'N creates or deletes systems, M moves them and U locks them so generators leave them alone.',
					'N cria ou apaga sistemas, M move e U trava pra que os geradores não mexam neles.',
				],
			},
			{
				title: ['Connections', 'Conexões'],
				text: [
					'H links two systems with a hyperlane, Shift+H with a wormhole.',
					'H liga dois sistemas com uma hiperpista, Shift+H com um wormhole.',
				],
			},
			{
				title: [
					'Spawns, nebulas and Fallen Empires',
					'Spawns, nebulosas e Impérios Caídos',
				],
				text: [
					'P marks spawns, J creates nebulas and F creates Fallen Empire zones.',
					'P marca spawns, J cria nebulosas e F cria zonas de Impérios Caídos.',
				],
			},
			{
				title: ['Right-click', 'Botão direito'],
				text: [
					'Right-click a system for its details: name, spawn type, a vanilla initializer (like Sol) or one of your System Forge designs.',
					'Clique com o botão direito num sistema pra ver os detalhes: nome, tipo de spawn, um inicializador do jogo (como Sol) ou um dos seus projetos do System Forge.',
				],
			},
		],
		link: {
			label: ['Go to Tweak', 'Ir pra Ajustar'],
			to: { kind: 'forge', step: 'tweak' },
		},
	},
	{
		id: 'layers',
		section: MAP,
		title: ['Layers', 'Camadas'],
		intro: [
			'Layers let you edit only what you want. Open them with the button on the tool rail or Alt+L.',
			'As camadas deixam você editar só o que quiser. Abra pelo botão na barra de ferramentas ou Alt+L.',
		],
		items: [
			{
				title: ['Hide and solo', 'Esconder e isolar'],
				text: [
					'The eye hides a layer. Alt+click the eye to show only that layer. Shift+1 to Shift+8 also toggle them.',
					'O olho esconde uma camada. Alt+clique no olho mostra só aquela camada. Shift+1 a Shift+8 também alternam.',
				],
			},
			{
				title: ['Lock', 'Travar'],
				text: [
					'A locked layer ignores every tool, so you cannot change it by accident.',
					'Uma camada travada ignora todas as ferramentas, então você não muda ela sem querer.',
				],
			},
		],
	},
	{
		id: 'system_forge',
		section: SYSTEMS,
		title: ['Designing a solar system', 'Montando um sistema solar'],
		intro: [
			'System Forge (Alt+S) designs solar systems planet by planet. Each design becomes a system initializer inside your mod.',
			'O System Forge (Alt+S) monta sistemas solares planeta por planeta. Cada projeto vira um inicializador de sistema dentro do seu mod.',
		],
		items: [
			{
				title: ['Star', 'Estrela'],
				text: [
					'Pick the star class (from red dwarfs to black holes) and its size. Add companion stars for binary or trinary systems.',
					'Escolha a classe da estrela (de anãs vermelhas a buracos negros) e o tamanho. Adicione estrelas companheiras pra sistemas binários ou trinários.',
				],
			},
			{
				title: ['Planets and moons', 'Planetas e luas'],
				text: [
					'Add planets (P) and drag them around their orbit. Each one has a class, size, ring and moons.',
					'Adicione planetas (P) e arraste pela órbita. Cada um tem classe, tamanho, anel e luas.',
				],
			},
			{
				title: ['Asteroid belts', 'Cinturões de asteroides'],
				text: [
					'B adds a rocky or icy belt. Drag it to change its radius.',
					'B adiciona um cinturão rochoso ou gelado. Arraste pra mudar o raio.',
				],
			},
			{
				title: ['Random', 'Aleatório'],
				text: [
					'R rerolls the whole system. Great to get ideas quickly.',
					'R sorteia o sistema inteiro de novo. Ótimo pra ter ideias rápido.',
				],
			},
		],
		link: {
			label: ['Open System Forge', 'Abrir o System Forge'],
			to: { kind: 'forge', panel: 'system' },
		},
	},
	{
		id: 'home_world',
		section: SYSTEMS,
		title: ['Home systems', 'Sistemas natais'],
		intro: [
			'A design with a home world can be the starting system of an empire.',
			'Um projeto com mundo natal pode ser o sistema inicial de um império.',
		],
		items: [
			{
				title: ['Home world', 'Mundo natal'],
				text: [
					'Tick Home world on a planet. It uses the ideal class of the species that spawns there and gets the normal starting buildings and resources.',
					'Marque Mundo natal num planeta. Ele usa a classe ideal da espécie que nascer ali e recebe os prédios e recursos iniciais normais.',
				],
			},
			{
				title: ['Put it on a spawn', 'Coloque num spawn'],
				text: [
					'Assign the design to a system marked as a spawn (P in the Tweak step), otherwise no empire starts there.',
					'Aplique o projeto num sistema marcado como spawn (P na etapa Ajustar), senão nenhum império começa ali.',
				],
			},
		],
	},
	{
		id: 'use_designs',
		section: SYSTEMS,
		title: ['Using your designs on the map', 'Usando seus projetos no mapa'],
		intro: [
			'Designs are saved inside the project and go into the exported mod automatically.',
			'Os projetos ficam salvos dentro do projeto e vão pro mod exportado automaticamente.',
		],
		items: [
			{
				title: ['From the map', 'Pelo mapa'],
				text: [
					'In the Tweak step, right-click a system and choose Design in System Forge. Then click Use on system.',
					'Na etapa Ajustar, clique com o botão direito num sistema e escolha Projetar no System Forge. Depois clique em Usar no sistema.',
				],
			},
			{
				title: ['From the details', 'Pelos detalhes'],
				text: [
					'Open System Details and pick the design under Custom system. The same design can be used on many systems.',
					'Abra os Detalhes do Sistema e escolha o projeto em Sistema personalizado. O mesmo projeto pode ser usado em vários sistemas.',
				],
			},
			{
				title: ['Solar System Editor files', 'Arquivos do Solar System Editor'],
				text: [
					'Import .txt initializer files from the Stellaris Solar System Editor or from other mods to keep editing them here.',
					'Importe arquivos .txt de inicializadores do Stellaris Solar System Editor ou de outros mods pra continuar editando aqui.',
				],
			},
		],
	},
	{
		id: 'export',
		section: SHARE,
		title: ['Exporting your mod', 'Exportando seu mod'],
		intro: [
			'Export (Ctrl+E) builds a zip with everything in place: descriptor, map, your systems and the icon.',
			'Exportar (Ctrl+E) gera um zip com tudo no lugar: descritor, mapa, seus sistemas e o ícone.',
		],
		items: [
			{
				title: ['Mod details', 'Dados do mod'],
				text: [
					'Set the name, version, description, tags and icon of the mod. They are saved with the project for the next export.',
					'Defina nome, versão, descrição, tags e ícone do mod. Eles ficam salvos no projeto pra próxima exportação.',
				],
			},
			{
				title: ['Icon', 'Ícone'],
				text: [
					'Use the picture of your map or upload your own image. It is cropped to a square and shown in the launcher and the Workshop.',
					'Use a imagem do seu mapa ou envie a sua. Ela é cortada em quadrado e aparece no launcher e na Oficina.',
				],
			},
			{
				title: ['Other files', 'Outros arquivos'],
				text: [
					'You can also download only the map .txt, a project backup .json or a map picture in several styles.',
					'Também dá pra baixar só o .txt do mapa, um backup .json do projeto ou uma imagem do mapa em vários estilos.',
				],
			},
		],
		link: {
			label: ['Open Export', 'Abrir Exportar'],
			to: { kind: 'forge', panel: 'export' },
		},
	},
	{
		id: 'reopen',
		section: SHARE,
		title: ['Updating a mod you made', 'Atualizando um mod que você fez'],
		intro: [
			'Mods exported by Stellar Forge carry the whole project inside, so you can open them again later.',
			'Os mods exportados pelo Stellar Forge levam o projeto inteiro dentro, então dá pra abrir de novo depois.',
		],
		items: [
			{
				title: ['Open the zip', 'Abra o zip'],
				text: [
					'Use Project → Open mod (.zip) and choose the zip you exported. The painting, systems, designs and mod details come back.',
					'Use Projeto → Abrir mod (.zip) e escolha o zip que você exportou. A pintura, os sistemas, os projetos e os dados do mod voltam.',
				],
			},
			{
				title: ['Older or other mods', 'Mods antigos ou de outros'],
				text: [
					'Zips without the project inside are rebuilt from the map file and the system initializers.',
					'Zips sem o projeto dentro são reconstruídos a partir do arquivo do mapa e dos inicializadores de sistema.',
				],
			},
			{
				title: ['New version', 'Versão nova'],
				text: [
					'Raise the version number before exporting again, then replace the old files in your mod folder.',
					'Aumente o número da versão antes de exportar de novo e substitua os arquivos antigos na pasta de mods.',
				],
			},
		],
	},
	{
		id: 'save',
		section: SHARE,
		title: [
			'Importing a galaxy from a save',
			'Importando a galáxia de um save',
		],
		intro: [
			'Loved the map of a campaign? Turn its galaxy into a project and make it a fixed map.',
			'Gostou do mapa de uma campanha? Transforme a galáxia num projeto e faça dela um mapa fixo.',
		],
		items: [
			{
				title: ['Where saves are', 'Onde ficam os saves'],
				text: [
					'Documents/Paradox Interactive/Stellaris/save games, one folder per campaign. Pick any .sav file.',
					'Documentos/Paradox Interactive/Stellaris/save games, uma pasta por campanha. Escolha qualquer arquivo .sav.',
				],
			},
			{
				title: ['What comes in', 'O que vem junto'],
				text: [
					'Systems, names, hyperlanes, wormholes and nebulas. Empire capitals can become spawn points and special systems like Sol can be kept.',
					'Sistemas, nomes, hiperpistas, wormholes e nebulosas. As capitais dos impérios podem virar spawns e sistemas especiais como Sol podem ser mantidos.',
				],
			},
			{
				title: ['Private', 'Privado'],
				text: [
					'The save is read in your browser and never uploaded.',
					'O save é lido no seu navegador e nunca é enviado pra internet.',
				],
			},
		],
		link: {
			label: ['Import a save', 'Importar um save'],
			to: { kind: 'forge', panel: 'save' },
		},
	},
	{
		id: 'troubleshooting',
		section: HELP,
		title: ['Something went wrong', 'Algo deu errado'],
		intro: [
			'The most common problems and how to fix them.',
			'Os problemas mais comuns e como resolver.',
		],
		items: [
			{
				title: ['The galaxy does not show up', 'A galáxia não aparece'],
				text: [
					'Check that Paint a Galaxy is enabled and that you chose the Elliptical shape. Your galaxy is in the size list.',
					'Confira se o Paint a Galaxy está ativo e se você escolheu o formato Elliptical. Sua galáxia fica na lista de tamanhos.',
				],
			},
			{
				title: ['The game crashes on start', 'O jogo fecha ao começar'],
				text: [
					'Try fewer stars or fewer AI empires than the Max Safe AI Empires value. Very big maps need a star names mod.',
					'Tente menos estrelas ou menos impérios de IA que o valor Máx. de Impérios IA Seguros. Mapas muito grandes precisam de um mod de nomes de estrelas.',
				],
			},
			{
				title: [
					'Empires spawn in odd places',
					'Impérios nascem em lugares estranhos',
				],
				text: [
					'Mark more spawn points (P in Tweak) or regenerate spawns in the Generate step.',
					'Marque mais pontos de spawn (P em Ajustar) ou gere os spawns de novo na etapa Gerar.',
				],
			},
		],
		link: {
			label: ['Ask on Discord', 'Perguntar no Discord'],
			to: { kind: 'url', url: 'https://discord.gg/s3EbgNSsJW' },
		},
	},
	{
		id: 'shortcuts',
		section: HELP,
		title: ['Keyboard shortcuts', 'Atalhos de teclado'],
		intro: [
			'Almost everything has a key. Press ? inside the Forge to see all of them.',
			'Quase tudo tem um atalho. Aperte ? dentro do Forge pra ver todos.',
		],
		items: [
			{
				title: ['Most used', 'Mais usados'],
				text: [
					'Ctrl+K commands · Ctrl+Z undo · Ctrl+G generate all · Ctrl+E export · Alt+1/2/3 steps · Alt+S System Forge · Alt+L layers · T text.',
					'Ctrl+K comandos · Ctrl+Z desfazer · Ctrl+G gerar tudo · Ctrl+E exportar · Alt+1/2/3 etapas · Alt+S System Forge · Alt+L camadas · T texto.',
				],
			},
		],
		link: {
			label: ['See all shortcuts', 'Ver todos os atalhos'],
			to: { kind: 'forge', panel: 'shortcuts' },
		},
	},
];
