/**
 * Utilitários para lidar com datas sem problemas de timezone
 * 
 * IMPORTANTE: O sistema usa datas no formato YYYY-MM-DD sem informação de timezone
 * Isso foi implementado para evitar a conversão automática de timezone que ocorre
 * quando você usa toISOString().
 * 
 * Exemplos de problemas evitados:
 * - Venda registrada às 23h em 31/10 não é convertida para 01/11
 * - Data sempre representa o dia local, não UTC
 * - Funciona corretamente independente do fuso horário
 */

/**
 * Obtém a data atual no formato YYYY-MM-DD (hora local, sem conversão de timezone)
 * 
 * @example
 * // Se for 31/10/2025 às 23h em Brasília
 * getTodayString() // Retorna "2025-10-31" (NÃO "2025-11-01")
 */
export const getTodayString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Extrai apenas a data de um valor (string, Date ou undefined)
 * Remove qualquer informação de hora e timezone
 * 
 * @example
 * extractDateOnly("2025-11-03T02:00:00.000Z") // "2025-11-03"
 * extractDateOnly("2025-11-03") // "2025-11-03"
 * extractDateOnly(new Date(2025, 10, 31)) // "2025-11-31"
 * extractDateOnly(undefined) // "2025-11-12" (hoje)
 */
export const extractDateOnly = (dateValue: any): string => {
  if (!dateValue) return getTodayString();

  // Se for string, extrair apenas a parte da data
  if (typeof dateValue === 'string') {
    // Se tem T (timestamp completo), pegar antes do T
    if (dateValue.includes('T')) {
      return dateValue.split('T')[0];
    }
    // Se é apenas data, retornar como está
    return dateValue;
  }

  // Se for Date object
  if (dateValue instanceof Date) {
    // Usar a data local sem conversão de timezone
    const year = dateValue.getFullYear();
    const month = String(dateValue.getMonth() + 1).padStart(2, '0');
    const day = String(dateValue.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return getTodayString();
};

/**
 * Adiciona dias a uma data string sem problemas de timezone
 * 
 * @example
 * addDaysToDateString("2025-10-31", 1) // "2025-11-01"
 * addDaysToDateString("2025-10-31", -1) // "2025-10-30"
 */
export const addDaysToDateString = (dateString: string, days: number): string => {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day); // month é 0-indexed
  date.setDate(date.getDate() + days);

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');

  return `${y}-${m}-${d}`;
};

/**
 * Converte uma data string para um objeto Date (interpretação local)
 * 
 * @example
 * parseDateString("2025-10-31") // Date object para 31/10/2025 às 00:00 local
 */
export const parseDateString = (dateStr: string): Date => {
  const datePart = dateStr.split('T')[0]; // Extrai "YYYY-MM-DD"
  const [year, month, day] = datePart.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Verifica se uma data é fim de semana (sábado ou domingo)
 * 
 * @example
 * isWeekend("2025-11-01") // true (sábado)
 * isWeekend("2025-11-03") // false (segunda)
 */
export const isWeekend = (dateString: string): boolean => {
  const date = parseDateString(dateString);
  const dayOfWeek = date.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6; // 0 = domingo, 6 = sábado
};

/**
 * Retorna o próximo dia útil após a data fornecida
 * Pula fins de semana automaticamente
 * Feriados devem ser checados separadamente com isFeriado()
 * 
 * @example
 * getNextBusinessDay("2025-11-07") // "2025-11-08" (sexta para segunda)
 */
export const getNextBusinessDay = (dateString: string): string => {
  let nextDay = addDaysToDateString(dateString, 1);
  
  // Pular fins de semana
  while (isWeekend(nextDay)) {
    nextDay = addDaysToDateString(nextDay, 1);
  }
  
  return nextDay;
};

/**
 * Retorna o próximo dia útil e não-feriado após a data fornecida
 * Precisa de acesso ao banco de dados para verificar feriados
 * Use isso para calcular datas de liquidação
 * 
 * NOTA: Essa função é genérica e precisa de um callback para verificar feriados
 * Veja calculateLiquidationDate no FinancialContext para implementação real
 * 
 * @example
 * getNextBusinessDaySkipHolidays("2025-11-07", async (date) => {
 *   // verificar se é feriado no banco de dados
 * }) // Retorna próximo dia útil que não é feriado
 */
export const getNextBusinessDaySkipHolidays = async (
  dateString: string,
  isFeriadoFn: (date: string) => Promise<boolean>
): Promise<string> => {
  let nextDay = getNextBusinessDay(dateString);
  
  // Verificar feriados (com limite de 30 dias para evitar loops infinitos)
  let attempts = 0;
  while (attempts < 30 && (await isFeriadoFn(nextDay))) {
    nextDay = addDaysToDateString(nextDay, 1);
    // Se caiu no fim de semana novamente, pular
    while (isWeekend(nextDay)) {
      nextDay = addDaysToDateString(nextDay, 1);
    }
    attempts++;
  }
  
  return nextDay;
};
