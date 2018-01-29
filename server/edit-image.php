<?php

require './libs/SimpleImage.php';

$tempImagesDirectory = dirname(__FILE__) . '/images/temp/';
$editImagesDirectory = dirname(__FILE__) . '/images/edit/';
$imagesDirectory = dirname(__FILE__) . '/images/';

$data = json_decode(file_get_contents('php://input'), true);

$currentImageDirectory = $data['editUrl'] === '' ? $tempImagesDirectory : $editImagesDirectory;

switch ($data['command']) {
  case 'ROTATE LEFT':
    $data['rotate'] = -90;
    editImage($data, $currentImageDirectory, $tempImagesDirectory, $editImagesDirectory, 'rotate');
    break;

  case 'ROTATE RIGHT':
    $data['rotate'] = 90;
    editImage($data, $currentImageDirectory, $tempImagesDirectory, $editImagesDirectory, 'rotate');
    break;

  case 'ORIGINAL':
    editImage($data, $currentImageDirectory, $tempImagesDirectory, $editImagesDirectory, 'filterOriginal');
    break;

  case 'DESATURATE':
    editImage($data, $currentImageDirectory, $tempImagesDirectory, $editImagesDirectory, 'filterDesaturate');
    break;

  case 'BLUR':
    editImage($data, $currentImageDirectory, $tempImagesDirectory, $editImagesDirectory, 'filterBlur');
    break;

  case 'BRIGHTEN':
    editImage($data, $currentImageDirectory, $tempImagesDirectory, $editImagesDirectory, 'filterBrighten');
    break;

  case 'CONTRAST':
    editImage($data, $currentImageDirectory, $tempImagesDirectory, $editImagesDirectory, 'filterContrast');
    break;

  case 'INVERT':
    editImage($data, $currentImageDirectory, $tempImagesDirectory, $editImagesDirectory, 'filterInvert');
    break;

  case 'SEPIA':
    editImage($data, $currentImageDirectory, $tempImagesDirectory, $editImagesDirectory, 'filterSepia');
    break;

  case 'SAVE EDIT':
    saveImage($data, $currentImageDirectory, $tempImagesDirectory, $editImagesDirectory, $imagesDirectory);
    break;

  default: break;
}

function editImage($data, $currentImageDirectory, $tempImagesDirectory, $editImagesDirectory, $callback)
{
  $url = $data['editUrl'] === '' ? $data['url'] : $data['editUrl'];
  $fileName = basename($url);
  $newFileName = preg_replace('/^(.*?)_/', 'img' . time() . '_', $fileName);

  $callback($data, $currentImageDirectory, $tempImagesDirectory, $editImagesDirectory, $fileName, $newFileName);

  if($data['editUrl'] !== ''){
    chown($editImagesDirectory . $fileName, 666);
    unlink($editImagesDirectory . $fileName);
  }

  sleep(1);

  $response = array('editUrl' => 'server/images/edit/' . $newFileName);
  echo json_encode($response);
}

function rotate($data, $currentImageDirectory, $tempImagesDirectory, $editImagesDirectory, $fileName, $newFileName)
{
  try {
    $image = new \claviska\SimpleImage();
    $image
      ->fromFile($currentImageDirectory . $fileName)
      ->rotate($data['rotate'], 'transparent')
      ->toFile($editImagesDirectory . $newFileName);
  } catch(Exception $err) {
    echo $err->getMessage();
  }
}


function filterOriginal($data, $currentImageDirectory, $tempImagesDirectory, $editImagesDirectory, $fileName, $newFileName)
{
  try {
    $original = basename($data['url']);
    $image = new \claviska\SimpleImage();
    $image
      ->fromFile($tempImagesDirectory . $original)
      ->toFile($editImagesDirectory . $newFileName);
  } catch(Exception $err) {
    echo $err->getMessage();
  }
}

function filterDesaturate($data, $currentImageDirectory, $tempImagesDirectory, $editImagesDirectory, $fileName, $newFileName)
{
  try {
    $image = new \claviska\SimpleImage();
    $image
      ->fromFile($currentImageDirectory . $fileName)
      ->desaturate()
      ->toFile($editImagesDirectory . $newFileName);
  } catch(Exception $err) {
    echo $err->getMessage();
  }
}

function filterBlur($data, $currentImageDirectory, $tempImagesDirectory, $editImagesDirectory, $fileName, $newFileName)
{
  try {
    $image = new \claviska\SimpleImage();
    $image
      ->fromFile($currentImageDirectory . $fileName)
      ->blur('gaussian', 5)
      ->toFile($editImagesDirectory . $newFileName);
  } catch(Exception $err) {
    echo $err->getMessage();
  }
}

function filterBrighten($data, $currentImageDirectory, $tempImagesDirectory, $editImagesDirectory, $fileName, $newFileName)
{
  try {
    $image = new \claviska\SimpleImage();
    $image
      ->fromFile($currentImageDirectory . $fileName)
      ->brighten(20)
      ->toFile($editImagesDirectory . $newFileName);
  } catch(Exception $err) {
    echo $err->getMessage();
  }
}

function filterContrast($data, $currentImageDirectory, $tempImagesDirectory, $editImagesDirectory, $fileName, $newFileName)
{
  try {
    $image = new \claviska\SimpleImage();
    $image
      ->fromFile($currentImageDirectory . $fileName)
      ->contrast(-20)
      ->toFile($editImagesDirectory . $newFileName);
  } catch(Exception $err) {
    echo $err->getMessage();
  }
}

function filterInvert($data, $currentImageDirectory, $tempImagesDirectory, $editImagesDirectory, $fileName, $newFileName)
{
  try {
    $image = new \claviska\SimpleImage();
    $image
      ->fromFile($currentImageDirectory . $fileName)
      ->invert()
      ->toFile($editImagesDirectory . $newFileName);
  } catch(Exception $err) {
    echo $err->getMessage();
  }
}

function filterSepia($data, $currentImageDirectory, $tempImagesDirectory, $editImagesDirectory, $fileName, $newFileName)
{
  try {
    $image = new \claviska\SimpleImage();
    $image
      ->fromFile($currentImageDirectory . $fileName)
      ->sepia()
      ->toFile($editImagesDirectory . $newFileName);
  } catch(Exception $err) {
    echo $err->getMessage();
  }
}

function filterSharpen($data, $currentImageDirectory, $tempImagesDirectory, $editImagesDirectory, $fileName, $newFileName)
{
  try {
    $image = new \claviska\SimpleImage();
    $image
      ->fromFile($currentImageDirectory . $fileName)
      ->sharpen()
      ->toFile($editImagesDirectory . $newFileName);
  } catch(Exception $err) {
    echo $err->getMessage();
  }
}

function saveImage($data, $currentImageDirectory, $tempImagesDirectory, $editImagesDirectory, $imagesDirectory)
{
    $url = $data['editUrl'] === '' ? $data['url'] : $data['editUrl'];
    $fileName = basename($url);
    $tempFileName = basename($data['url']);

    rename($currentImageDirectory . $fileName, $tempImagesDirectory . $tempFileName);

    try {
      $newFileName = preg_replace('/^(.*?)_/', 'img' . time() . '_', $fileName);

      $image = new \claviska\SimpleImage();
      $image
        ->fromFile($tempImagesDirectory . $tempFileName)
        ->resize($data['width'], $data['height'])
        ->toFile($tempImagesDirectory . $newFileName);

      $response = array('url' => 'server/images/temp/' . $newFileName);
      echo json_encode($response);
    } catch(Exception $err) {
      echo $err->getMessage();
    }
}

?>
