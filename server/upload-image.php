<?php

require './libs/SimpleImage.php';

$tempImagesDirectory = dirname(__FILE__) . '/images/temp/';
$imagesDirectory = dirname(__FILE__) . '/images/';

$url  = $_POST['url'];
$type = $_POST['type'];

if($type === 'TEMP'){
  if(is_array($_FILES)) {
    if(is_uploaded_file($_FILES['userImage']['tmp_name'])) {
      $sourcePath = $_FILES['userImage']['tmp_name'];

      if($url !== ''){
        chown($tempImagesDirectory . basename($url), 666);
        unlink($tempImagesDirectory . basename($url));
      }

      try {
        $file_info = pathinfo($_FILES['userImage']['name']);
        $targetPath = 'images/temp/img' . time() . '_' . md5($file_info['filename']) . '.' . $file_info['extension'];

        $image = new \claviska\SimpleImage($sourcePath);
        $width = $image->getWidth();
        $height = $image->getHeight();

        if($width > 1366){
          $image = new \claviska\SimpleImage();
          $image
            ->fromFile($sourcePath)
            ->resize(1366)
            ->toFile($targetPath);
          echo 'server/' . $targetPath;
          return;
        }

        if($height > 768){
          $image = new \claviska\SimpleImage();
          $image
            ->fromFile($sourcePath)
            ->resize(null, 768)
            ->toFile($targetPath);
          echo 'server/' . $targetPath;
          return;
        }

        if(move_uploaded_file($sourcePath, $targetPath)) {
          echo 'server/' . $targetPath;
        }
      } catch(Exception $err) {
        echo $err->getMessage();
      }
  	}
  }
} else{
  rename($tempImagesDirectory . basename($url), $imagesDirectory . basename($url));
  echo 'server/images/' . basename($url);
}

?>
