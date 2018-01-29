<?php

$tempImagesDirectory = dirname(__FILE__) . '/images/temp/*';
$editImagesDirectory = dirname(__FILE__) . '/images/edit/*';

$tempFiles = glob($tempImagesDirectory, GLOB_BRACE);
foreach($tempFiles as $file){
  if(is_file($file))
    chown($file, 666);
    unlink($file);
}

$editFiles = glob($editImagesDirectory, GLOB_BRACE);
foreach($editFiles as $file){
  if(is_file($file))
    chown($file, 666);
    unlink($file);
}