// score.js
export function calcolaScore (barca, meteo) {
  // Check for critical marine parameters indicating "not at sea" or insufficient data
  if (meteo.wave_period == null || meteo.wind_wave_height == null || meteo.wind_wave_period == null) {
    return { errorType: 'INCOMPLETE_MARINE_DATA' }
  }

  let score = 100
  const details = []

  // 1. Altezza onda totale
  let waveDeduction = 0
  let waveStatus = 'good'
  if (meteo.wave_height > 2) {
    waveDeduction = 30
    waveStatus = 'danger'
  } else if (meteo.wave_height > 1) {
    waveDeduction = 15
    waveStatus = 'warning'
  } else if (meteo.wave_height > 0.5) {
    waveDeduction = 5
    waveStatus = 'warning'
  }
  score -= waveDeduction
  details.push({
    name: 'waveHeight',
    value: meteo.wave_height?.toFixed(1) || '0.0', // Default to '0.0' if N/A after checks
    unit: 'm',
    status: waveStatus,
    penalty: waveDeduction
  })

  // 2. Periodo onda totale
  let periodDeduction = 0
  let periodStatus = 'good'
  // This check is now safe because meteo.wave_period is confirmed not null
  if (meteo.wave_period < 5) {
    periodDeduction = 20
    periodStatus = 'danger'
  } else if (meteo.wave_period < 7) {
    periodDeduction = 10
    periodStatus = 'warning'
  }
  score -= periodDeduction
  details.push({
    name: 'wavePeriod',
    value: meteo.wave_period.toFixed(1), // Safe to call toFixed
    unit: 's',
    status: periodStatus,
    penalty: periodDeduction
  })

  // 3. Mare del vento - altezza
  let windWaveDeduction = 0
  let windWaveStatus = 'good'
  // This check is now safe because meteo.wind_wave_height is confirmed not null
  if (meteo.wind_wave_height > 1) {
    windWaveDeduction = 10
    windWaveStatus = 'warning'
  }
  score -= windWaveDeduction
  details.push({
    name: 'windWaveHeight',
    value: meteo.wind_wave_height.toFixed(1), // Safe to call toFixed
    unit: 'm',
    status: windWaveStatus,
    penalty: windWaveDeduction
  })

  // 4. Mare del vento - periodo
  let windPeriodDeduction = 0
  let windPeriodStatus = 'good'
  // This check is now safe because meteo.wind_wave_period is confirmed not null
  if (meteo.wind_wave_period < 5) {
    windPeriodDeduction = 5
    windPeriodStatus = 'warning'
  }
  score -= windPeriodDeduction
  details.push({
    name: 'windWavePeriod',
    value: meteo.wind_wave_period.toFixed(1), // Safe to call toFixed
    unit: 's',
    status: windPeriodStatus,
    penalty: windPeriodDeduction
  })

  // 5. Vento medio
  const ventoNodi = meteo.wind_speed_10m * 1.94384
  let windDeduction = 0
  let windStatus = 'good'
  if (ventoNodi > 25) {
    windDeduction = 25
    windStatus = 'danger'
  } else if (ventoNodi > 15) {
    windDeduction = 10
    windStatus = 'warning'
  }
  score -= windDeduction
  details.push({
    name: 'windSpeed',
    value: ventoNodi.toFixed(1),
    unit: 'kt',
    status: windStatus,
    penalty: windDeduction
  })

  // 6. Raffiche
  const rafficheNodi = meteo.wind_gusts_10m * 1.94384
  const gustDiff = rafficheNodi - ventoNodi
  let gustDeduction = 0
  let gustStatus = 'good'
  if (gustDiff > 10) {
    gustDeduction = 5
    gustStatus = 'warning'
  }
  score -= gustDeduction
  details.push({
    name: 'windGusts',
    value: `+${gustDiff.toFixed(1)}`,
    unit: 'kt',
    status: gustStatus,
    penalty: gustDeduction
  })

  // 7. Visibilità (non disponibile in OpenMeteo, assume buona)
  details.push({
    name: 'visibility',
    value: 'Buona', // Consider making this translatable if needed
    unit: '',
    status: 'good',
    penalty: 0
  })

  // 8. Stabilità barca
  let stabilityDeduction = 0
  let stabilityStatus = 'good'
  // Ensure barca.loa and barca.weight are numbers for calculation
  if (typeof barca.loa === 'number' && typeof barca.weight === 'number' && barca.weight !== 0) {
    const currentRatioLD = barca.loa / barca.weight
    if (currentRatioLD < 0.001) { // Assuming ratioLD is comparable to this value
      stabilityDeduction = 10
      stabilityStatus = 'warning'
    }
    details.push({
      name: 'boatStability',
      value: (currentRatioLD * 1000).toFixed(2), // Example scaling for display
      unit: '', // Define unit or context if needed
      status: stabilityStatus,
      penalty: stabilityDeduction
    })
  } else { // Handle case where boat params for stability are not valid numbers
    details.push({
      name: 'boatStability',
      value: 'N/A',
      unit: '',
      status: 'warning', // Or 'nodata'
      penalty: 0 // Or a default penalty if this is critical
    })
  }
  score -= stabilityDeduction

  // 9. Categoria CE
  let categoryDeduction = 0
  let categoryStatus = 'good'
  if (barca.category === 'C' && meteo.wave_height > 2) {
    categoryDeduction = 20
    categoryStatus = 'danger'
  } else if (barca.category === 'D' && meteo.wave_height > 0.5) { // Example for Cat D
    categoryDeduction = 25
    categoryStatus = 'danger'
  }
  score -= categoryDeduction
  details.push({
    name: 'boatCategory',
    value: barca.category || 'N/A',
    unit: '',
    status: categoryStatus,
    penalty: categoryDeduction
  })

  const finalScore = Math.max(0, Math.min(100, score))

  return {
    score: finalScore,
    details
  }
}
