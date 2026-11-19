<?php
// Registro de alertas de remates (Ventura Legal). Recibe el formulario de /remates/alertas/ y lo envía por correo
// al buzón del estudio, donde la rutina diaria lo lee para armar el registro. No guarda nada en el servidor.
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
function fin($ok, $msg, $code = 200) { http_response_code($code); echo json_encode(['ok' => $ok, 'msg' => $msg], JSON_UNESCAPED_UNICODE); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') fin(false, 'Método no permitido', 405);
$ref = ($_SERVER['HTTP_ORIGIN'] ?? '') . ' ' . ($_SERVER['HTTP_REFERER'] ?? '');
if (stripos($ref, 'venturalegal.pe') === false) fin(false, 'Origen no válido', 403);
$raw = file_get_contents('php://input');
if (strlen($raw) > 4000) fin(false, 'Solicitud demasiado grande', 413);
$d = json_decode($raw, true);
if (!is_array($d)) fin(false, 'Datos no válidos', 400);
if (!empty($d['web'])) fin(true, 'ok');                       // campo trampa para robots
$t = function ($k, $max = 120) use ($d) { $v = isset($d[$k]) ? (is_scalar($d[$k]) ? (string)$d[$k] : '') : ''; $v = trim(preg_replace('/[\x00-\x1F\x7F<>]+/u', ' ', $v)); return mb_substr($v, 0, $max); };
$email = filter_var($t('email', 150), FILTER_VALIDATE_EMAIL);
if (!$email) fin(false, 'Escribe un correo válido.', 422);
$nombre = $t('nombre', 80);
if (mb_strlen($nombre) < 2) fin(false, 'Escribe tu nombre.', 422);
if (empty($d['consentimiento'])) fin(false, 'Falta la autorización de datos.', 422);
$tel = preg_replace('/\D+/', '', $t('tel', 20));
$tipos = [];
if (isset($d['tipos']) && is_array($d['tipos'])) foreach ($d['tipos'] as $x) { if (in_array($x, ['casa', 'departamento', 'terreno', 'local', 'estacionamiento', 'otro'], true)) $tipos[] = $x; }
$num = function ($k) use ($d) { return (isset($d[$k]) && is_numeric($d[$k]) && $d[$k] >= 0) ? (float)$d[$k] : null; };
$a = [
  'nombre' => $nombre, 'email' => strtolower($email), 'tel' => $tel,
  'zona' => $t('zona', 60), 'sub' => $t('sub', 60), 'tipos' => $tipos,
  'mon' => in_array($t('mon', 4), ['S/', 'US$'], true) ? $t('mon', 4) : '',
  'min' => $num('min'), 'max' => $num('max'), 'area' => $num('area'),
  'sc' => !empty($d['sc']), 'semanal' => !empty($d['semanal']),
  'consentimiento' => true, 'fecha' => gmdate('Y-m-d\TH:i:s\Z'),
];
$json = json_encode($a, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
$ub = $a['zona'] ? ($a['sub'] ? $a['sub'] . ', ' . $a['zona'] : $a['zona']) : 'todo el Perú';
$cuerpo = "Nueva alerta de remates registrada en venturalegal.pe/remates/alertas/\n\n"
  . "Nombre: {$a['nombre']}\nCorreo: {$a['email']}\nWhatsApp: " . ($tel ?: 'no indicó') . "\nUbicación: $ub\n"
  . "Tipo: " . ($tipos ? implode(', ', $tipos) : 'cualquiera') . "\nMoneda: " . ($a['mon'] ?: 'cualquiera')
  . "\nBase: " . ($a['min'] ?? '0') . " a " . ($a['max'] ?? 'sin límite') . "\nÁrea mínima: " . ($a['area'] ?? 'sin mínimo')
  . "\nSolo sin cargas: " . ($a['sc'] ? 'sí' : 'no') . "\nFrecuencia: " . ($a['semanal'] ? 'semanal (viernes)' : 'cada día con coincidencias')
  . "\nAutorización de datos (Ley N.° 29733): sí\n\n@@ALERTA_INI@@" . $json . "@@ALERTA_FIN@@\n";
$asunto = '=?UTF-8?B?' . base64_encode('[ALERTA-REMATES] Nueva alerta: ' . $ub) . '?=';
$cab = "From: Alertas de remates <alertas@venturalegal.pe>\r\nReply-To: " . $a['email'] . "\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit\r\nX-Alerta-Remates: 1";
$ok = @mail('victor@venturalegal.pe', $asunto, $cuerpo, $cab, '-falertas@venturalegal.pe');
if (!$ok) fin(false, 'No pudimos registrar tu alerta en este momento. Envíala por WhatsApp con el botón de abajo.', 500);
fin(true, 'Alerta registrada');
