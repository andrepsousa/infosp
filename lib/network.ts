export type Line = { id: number; name: string; color: string; operator: string; stations: string[]; note?: string };

// Station order transcribed from the STM network map, July 2026.
// Display names are shortened where sponsorship does not change station identity.
export const lines: Line[] = [
  { id: 1, name: 'Azul', color: '#0455a1', operator: 'Metrô', stations: 'Jabaquara|Conceição|São Judas|Saúde|Praça da Árvore|Santa Cruz|Vila Mariana|Ana Rosa|Paraíso|Vergueiro|São Joaquim|Japão-Liberdade|Sé|São Bento|Luz|Tiradentes|Armênia|Portuguesa-Tietê|Carandiru|Santana|Jardim São Paulo-Ayrton Senna|Parada Inglesa|Tucuruvi'.split('|') },
  { id: 2, name: 'Verde', color: '#008061', operator: 'Metrô', stations: 'Vila Madalena|Sumaré|Clínicas|Consolação|Trianon-Masp|Brigadeiro|Paraíso|Ana Rosa|Chácara Klabin|Santos-Imigrantes|Alto do Ipiranga|Sacomã|Tamanduateí|Vila Prudente'.split('|') },
  { id: 3, name: 'Vermelha', color: '#ec443d', operator: 'Metrô', stations: 'Palmeiras-Barra Funda|Marechal Deodoro|Santa Cecília|República|Anhangabaú|Sé|Pedro II|Brás|Bresser-Mooca|Belém|Tatuapé|Carrão|Penha|Vila Matilde|Guilhermina-Esperança|Patriarca-Vila Ré|Artur Alvim|Corinthians-Itaquera'.split('|') },
  { id: 4, name: 'Amarela', color: '#bb9200', operator: 'ViaQuatro', stations: 'Luz|República|Higienópolis-Mackenzie|Paulista|Oscar Freire|Fradique Coutinho|Faria Lima|Pinheiros|Butantã|São Paulo-Morumbi|Vila Sônia'.split('|') },
  { id: 5, name: 'Lilás', color: '#8750ad', operator: 'ViaMobilidade', stations: 'Capão Redondo|Campo Limpo|Vila das Belezas|Giovanni Gronchi|Santo Amaro|Largo Treze|Adolfo Pinheiro|Alto da Boa Vista|Borba Gato|Brooklin|Campo Belo|Eucaliptos|Moema|AACD-Servidor|Hospital São Paulo|Santa Cruz|Chácara Klabin'.split('|') },
  { id: 6, name: 'Laranja', color: '#f47721', operator: 'LinhaUni', stations: 'João Paulo I|Freguesia do Ó|Santa Marina|Água Branca|SESC-Pompeia|Perdizes'.split('|'), note: 'Trecho representado no mapa oficial de julho de 2026. Consulte a operadora para a fase e os horários de operação.' },
  { id: 7, name: 'Rubi', color: '#a51c78', operator: 'TIC Trens', stations: 'Palmeiras-Barra Funda|Água Branca|Lapa|Piqueri|Pirituba|Vila Clarice|Jaraguá|Vila Aurora|Perus|Caieiras|Franco da Rocha|Baltazar Fidélis|Francisco Morato|Botujuru|Campo Limpo Paulista|Várzea Paulista|Jundiaí'.split('|') },
  { id: 8, name: 'Diamante', color: '#777a70', operator: 'ViaMobilidade', stations: 'Júlio Prestes|Palmeiras-Barra Funda|Lapa|Domingos de Moraes|Imperatriz Leopoldina|Presidente Altino|Osasco|Comandante Sampaio|Quitaúna|General Miguel Costa|Carapicuíba|Santa Terezinha|Antônio João|Barueri|Jardim Belval|Jardim Silveira|Jandira|Sagrado Coração|Engenheiro Cardoso|Itapevi|Santa Rita|Amador Bueno'.split('|'), note: 'A extensão Itapevi-Amador Bueno tem operação própria. As estações Lapa das linhas 7 e 8 são distintas e não têm integração gratuita.' },
  { id: 9, name: 'Esmeralda', color: '#009b87', operator: 'ViaMobilidade', stations: 'Osasco|Presidente Altino|Ceasa|Vila Lobos-Jaguaré|Cidade Universitária|Pinheiros|Hebraica-Rebouças|Cidade Jardim|Vila Olímpia|Berrini|Morumbi|Granja Julieta|João Dias|Santo Amaro|Socorro|Jurubatuba|Autódromo|Primavera-Interlagos|Grajaú|Mendes-Vila Natal|Varginha'.split('|') },
  { id: 10, name: 'Turquesa', color: '#00879c', operator: 'CPTM', stations: 'Palmeiras-Barra Funda|Luz|Brás|Juventus-Mooca|Ipiranga|Tamanduateí|São Caetano do Sul|Utinga|Prefeito Saladino|Santo André|Capuava|Mauá|Guapituba|Ribeirão Pires|Rio Grande da Serra'.split('|') },
  { id: 11, name: 'Coral', color: '#e65423', operator: 'Trivia Trens', stations: 'Palmeiras-Barra Funda|Luz|Brás|Tatuapé|Corinthians-Itaquera|Dom Bosco|José Bonifácio|Guaianases|Antônio Gianetti Neto|Ferraz de Vasconcelos|Poá|Calmon Viana|Suzano|Jundiapeba|Brás Cubas|Mogi das Cruzes|Estudantes'.split('|') },
  { id: 12, name: 'Safira', color: '#174d94', operator: 'Trivia Trens', stations: 'Brás|Tatuapé|Engenheiro Goulart|USP Leste|Comendador Ermelino|São Miguel Paulista|Jardim Helena-Vila Mara|Itaim Paulista|Jardim Romano|Engenheiro Manoel Feio|Itaquaquecetuba|Aracaré|Calmon Viana'.split('|') },
  { id: 13, name: 'Jade', color: '#00a451', operator: 'Trivia Trens', stations: 'Engenheiro Goulart|Guarulhos-Cecap|Aeroporto-Guarulhos'.split('|'), note: 'O Expresso Aeroporto é um serviço separado. Consulte seus horários e paradas na operadora.' },
  { id: 15, name: 'Prata', color: '#78858b', operator: 'Metrô', stations: 'Vila Prudente|Oratório|São Lucas|Camilo Haddad|Vila Tolstói|Vila União|Jardim Planalto|Sapopemba|Fazenda da Juta|São Mateus|Jardim Colonial'.split('|') },
  { id: 17, name: 'Ouro', color: '#978252', operator: 'Metrô', stations: 'Morumbi|Chucri Zaidan|Vila Cordeiro|Campo Belo|Vereador José Diniz|Brooklin Paulista|Washington Luís'.split('|'), note: 'Ramal para Aeroporto de Congonhas a partir de Brooklin Paulista. Verifique horários e condições da operação na fonte.' },
];

export const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export function stationsFor(line: Line) {
  return line.id === 17 ? [...line.stations, 'Aeroporto de Congonhas'] : line.stations;
}
export function connections(station: string, lineId: number) {
  if (station === 'Lapa') return [];
  const aliases: Record<string, string> = { Paulista: 'Consolação', 'Consolação': 'Paulista' };
  return lines.filter(line => line.id !== lineId && (stationsFor(line).includes(station) || stationsFor(line).includes(aliases[station])));
}
