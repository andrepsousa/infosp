export type Line = { id: number; name: string; color: string; operator: string; stations: string[]; note?: string };

// Station order transcribed from the STM network map, July 2026.
// Display names are shortened where sponsorship does not change station identity.
export const lines: Line[] = [
  { id: 1, name: 'Azul', color: '#0455a1', operator: 'Metr�', stations: 'Jabaquara|Concei��o|S�o Judas|Sa�de|Pra�a da �rvore|Santa Cruz|Vila Mariana|Ana Rosa|Para�so|Vergueiro|S�o Joaquim|Jap�o-Liberdade|S�|S�o Bento|Luz|Tiradentes|Arm�nia|Portuguesa-Tiet�|Carandiru|Santana|Jardim S�o Paulo-Ayrton Senna|Parada Inglesa|Tucuruvi'.split('|') },
  { id: 2, name: 'Verde', color: '#008061', operator: 'Metr�', stations: 'Vila Madalena|Sumar�|Cl�nicas|Consola��o|Trianon-Masp|Brigadeiro|Para�so|Ana Rosa|Ch�cara Klabin|Santos-Imigrantes|Alto do Ipiranga|Sacom�|Tamanduate�|Vila Prudente'.split('|') },
  { id: 3, name: 'Vermelha', color: '#ec443d', operator: 'Metr�', stations: 'Palmeiras-Barra Funda|Marechal Deodoro|Santa Cec�lia|Rep�blica|Anhangaba�|S�|Pedro II|Br�s|Bresser-Mooca|Bel�m|Tatuap�|Carr�o|Penha|Vila Matilde|Guilhermina-Esperan�a|Patriarca-Vila R�|Artur Alvim|Corinthians-Itaquera'.split('|') },
  { id: 4, name: 'Amarela', color: '#bb9200', operator: 'ViaQuatro', stations: 'Luz|Rep�blica|Higien�polis-Mackenzie|Paulista|Oscar Freire|Fradique Coutinho|Faria Lima|Pinheiros|Butant�|S�o Paulo-Morumbi|Vila S�nia'.split('|') },
  { id: 5, name: 'Lil�s', color: '#8750ad', operator: 'ViaMobilidade', stations: 'Cap�o Redondo|Campo Limpo|Vila das Belezas|Giovanni Gronchi|Santo Amaro|Largo Treze|Adolfo Pinheiro|Alto da Boa Vista|Borba Gato|Brooklin|Campo Belo|Eucaliptos|Moema|AACD-Servidor|Hospital S�o Paulo|Santa Cruz|Ch�cara Klabin'.split('|') },
  { id: 6, name: 'Laranja', color: '#f47721', operator: 'LinhaUni', stations: 'Jo�o Paulo I|Freguesia do �|Santa Marina|�gua Branca|SESC-Pompeia|Perdizes'.split('|'), note: 'Trecho representado no mapa oficial de julho de 2026. Consulte a operadora para a fase e os hor�rios de opera��o.' },
  { id: 7, name: 'Rubi', color: '#a51c78', operator: 'TIC Trens', stations: 'Palmeiras-Barra Funda|�gua Branca|Lapa|Piqueri|Pirituba|Vila Clarice|Jaragu�|Vila Aurora|Perus|Caieiras|Franco da Rocha|Baltazar Fid�lis|Francisco Morato|Botujuru|Campo Limpo Paulista|V�rzea Paulista|Jundia�'.split('|') },
  { id: 8, name: 'Diamante', color: '#777a70', operator: 'ViaMobilidade', stations: 'J�lio Prestes|Palmeiras-Barra Funda|Lapa|Domingos de Moraes|Imperatriz Leopoldina|Presidente Altino|Osasco|Comandante Sampaio|Quita�na|General Miguel Costa|Carapicu�ba|Santa Terezinha|Ant�nio Jo�o|Barueri|Jardim Belval|Jardim Silveira|Jandira|Sagrado Cora��o|Engenheiro Cardoso|Itapevi|Santa Rita|Amador Bueno'.split('|'), note: 'A extens�o Itapevi-Amador Bueno tem opera��o pr�pria. As esta��es Lapa das linhas 7 e 8 s�o distintas e n�o t�m integra��o gratuita.' },
  { id: 9, name: 'Esmeralda', color: '#009b87', operator: 'ViaMobilidade', stations: 'Osasco|Presidente Altino|Ceasa|Vila Lobos-Jaguar�|Cidade Universit�ria|Pinheiros|Hebraica-Rebou�as|Cidade Jardim|Vila Ol�mpia|Berrini|Morumbi|Granja Julieta|Jo�o Dias|Santo Amaro|Socorro|Jurubatuba|Aut�dromo|Primavera-Interlagos|Graja�|Mendes-Vila Natal|Varginha'.split('|') },
  { id: 10, name: 'Turquesa', color: '#00879c', operator: 'CPTM', stations: 'Palmeiras-Barra Funda|Luz|Br�s|Juventus-Mooca|Ipiranga|Tamanduate�|S�o Caetano do Sul|Utinga|Prefeito Saladino|Santo Andr�|Capuava|Mau�|Guapituba|Ribeir�o Pires|Rio Grande da Serra'.split('|') },
  { id: 11, name: 'Coral', color: '#e65423', operator: 'Trivia Trens', stations: 'Palmeiras-Barra Funda|Luz|Br�s|Tatuap�|Corinthians-Itaquera|Dom Bosco|Jos� Bonif�cio|Guaianases|Ant�nio Gianetti Neto|Ferraz de Vasconcelos|Po�|Calmon Viana|Suzano|Jundiapeba|Br�s Cubas|Mogi das Cruzes|Estudantes'.split('|') },
  { id: 12, name: 'Safira', color: '#174d94', operator: 'Trivia Trens', stations: 'Br�s|Tatuap�|Engenheiro Goulart|USP Leste|Comendador Ermelino|S�o Miguel Paulista|Jardim Helena-Vila Mara|Itaim Paulista|Jardim Romano|Engenheiro Manoel Feio|Itaquaquecetuba|Aracar�|Calmon Viana'.split('|') },
  { id: 13, name: 'Jade', color: '#00a451', operator: 'Trivia Trens', stations: 'Engenheiro Goulart|Guarulhos-Cecap|Aeroporto-Guarulhos'.split('|'), note: 'O Expresso Aeroporto � um servi�o separado. Consulte seus hor�rios e paradas na operadora.' },
  { id: 15, name: 'Prata', color: '#78858b', operator: 'Metr�', stations: 'Vila Prudente|Orat�rio|S�o Lucas|Camilo Haddad|Vila Tolst�i|Vila Uni�o|Jardim Planalto|Sapopemba|Fazenda da Juta|S�o Mateus|Jardim Colonial'.split('|') },
  { id: 17, name: 'Ouro', color: '#978252', operator: 'Metr�', stations: 'Morumbi|Chucri Zaidan|Vila Cordeiro|Campo Belo|Vereador Jos� Diniz|Brooklin Paulista|Washington Lu�s'.split('|'), note: 'Ramal para Aeroporto de Congonhas a partir de Brooklin Paulista. Verifique hor�rios e condi��es da opera��o na fonte.' },
];

export const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export function stationsFor(line: Line) {
  return line.id === 17 ? [...line.stations, 'Aeroporto de Congonhas'] : line.stations;
}
export function connections(station: string, lineId: number) {
  if (station === 'Lapa') return [];
  const aliases: Record<string, string> = { Paulista: 'Consola��o', Consola��o: 'Paulista' };
  return lines.filter(line => line.id !== lineId && (stationsFor(line).includes(station) || stationsFor(line).includes(aliases[station])));
}
