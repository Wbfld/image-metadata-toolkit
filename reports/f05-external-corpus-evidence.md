# External corpus differential report

- Schema: `browser-image-metadata.external-report.v2`
- Fixtures examined: 108 (minimum 100)
- Unique fixture hashes: 108 (minimum 100)
- Corpus: ianare/exif-py @ `a69bf74770caf6b333221658f5092ed69f99faac`
- Corpus source: **ianare-exif-py** — ianare/exif-py @ `a69bf74770caf6b333221658f5092ed69f99faac`; 108 fixtures; license/provenance: pinned exif-py repository
- Total fixture bytes: 52427283
- Package: browser-image-metadata 2.0.0-alpha.3
- Reference: ExifTool via exiftool-vendored; package 38.1.0; ExifTool 13.59
- Registry: 1 / `3ad6c7db827e6086175d713c57bec7fe67885501aebbc4f00036c6ca75c54f23`
- Allowlist: 1 entries, `bc0d4cda193d4652b32625d3a78e379e90f2607fe933357865cab17617ecb82d`
- Normalization: browser-image-metadata.external-normalization.v1 / `042477dd007ba7862b86b6eef122d38f8a14c3e5357061e33fedd3df86ba2e0c`
- Gate: **PASS**
- Missing-local rate: 0.70% (maximum 5.00%)
- Mismatches: 0 (maximum 0)
- Comparable values: 3405 (minimum 0)
- Semantic agreement: 100.00% (minimum 0.00%)
- Non-comparable values: 10

## Totals

| found | matched | normalized-match | mismatched | missing-local | missing-reference | non-comparable |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 3773 | 2302 | 1103 | 0 | 24 | 358 | 10 |

## Per-field results

| field | family | found | matched | normalized | mismatched | missing local | missing reference | non-comparable |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| block:EXIF | EXIF | 98 | 96 | 0 | 0 | 0 | 0 | 2 |
| block:ICC | ICC | 28 | 27 | 0 | 0 | 0 | 1 | 0 |
| block:IPTC | IPTC | 11 | 9 | 0 | 0 | 0 | 2 | 0 |
| block:JFIF | JFIF | 56 | 56 | 0 | 0 | 0 | 0 | 0 |
| block:XMP | XMP | 38 | 38 | 0 | 0 | 0 | 0 | 0 |
| DIMENSIONS:height | DIMENSIONS | 108 | 100 | 0 | 0 | 0 | 8 | 0 |
| DIMENSIONS:width | DIMENSIONS | 108 | 100 | 0 | 0 | 0 | 8 | 0 |
| EXIF:Acceleration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EXIF:ApertureValue | EXIF | 32 | 0 | 32 | 0 | 0 | 0 | 0 |
| EXIF:Artist | EXIF | 11 | 7 | 0 | 0 | 0 | 4 | 0 |
| EXIF:BitsPerSample | EXIF | 11 | 0 | 11 | 0 | 0 | 0 | 0 |
| EXIF:BodySerialNumber | EXIF | 2 | 1 | 1 | 0 | 0 | 0 | 0 |
| EXIF:BrightnessValue | EXIF | 14 | 0 | 14 | 0 | 0 | 0 | 0 |
| EXIF:CameraElevationAngle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EXIF:CameraFirmware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EXIF:CameraOwnerName | EXIF | 2 | 0 | 0 | 0 | 0 | 2 | 0 |
| EXIF:CFAPattern | EXIF | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| EXIF:ChromaticAberrationCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EXIF:ColorSpace | EXIF | 64 | 64 | 0 | 0 | 0 | 0 | 0 |
| EXIF:ComponentsConfiguration | EXIF | 56 | 55 | 1 | 0 | 0 | 0 | 0 |
| EXIF:CompositeImage | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| EXIF:CompressedBitsPerPixel | EXIF | 34 | 0 | 33 | 0 | 0 | 1 | 0 |
| EXIF:Compression | EXIF | 66 | 66 | 0 | 0 | 0 | 0 | 0 |
| EXIF:Contrast | EXIF | 23 | 23 | 0 | 0 | 1 | 0 | 0 |
| EXIF:Copyright | EXIF | 18 | 9 | 9 | 0 | 0 | 0 | 0 |
| EXIF:CustomRendered | EXIF | 35 | 35 | 0 | 0 | 3 | 0 | 0 |
| EXIF:DateTime | EXIF | 67 | 0 | 67 | 0 | 0 | 0 | 0 |
| EXIF:DateTimeDigitized | EXIF | 57 | 0 | 57 | 0 | 0 | 0 | 0 |
| EXIF:DateTimeOriginal | EXIF | 62 | 0 | 62 | 0 | 1 | 0 | 0 |
| EXIF:DevelopmentType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EXIF:DevelopmentTypeDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EXIF:DeviceSettingDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EXIF:DigitalZoomRatio | EXIF | 33 | 0 | 32 | 0 | 1 | 1 | 0 |
| EXIF:DistortionCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EXIF:ExifIFDPointer | EXIF | 86 | 0 | 0 | 0 | 0 | 86 | 0 |
| EXIF:ExifVersion | EXIF | 61 | 1 | 60 | 0 | 0 | 0 | 0 |
| EXIF:ExposureBiasValue | EXIF | 58 | 0 | 58 | 0 | 0 | 0 | 0 |
| EXIF:ExposureIndex | EXIF | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| EXIF:ExposureMode | EXIF | 40 | 40 | 0 | 0 | 2 | 0 | 0 |
| EXIF:ExposureProgram | EXIF | 48 | 48 | 0 | 0 | 0 | 0 | 0 |
| EXIF:ExposureTime | EXIF | 59 | 0 | 59 | 0 | 0 | 0 | 0 |
| EXIF:FileSource | EXIF | 45 | 45 | 0 | 0 | 0 | 0 | 0 |
| EXIF:Flash | EXIF | 65 | 65 | 0 | 0 | 0 | 0 | 0 |
| EXIF:FlashEnergy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EXIF:FlashpixVersion | EXIF | 57 | 1 | 56 | 0 | 0 | 0 | 0 |
| EXIF:FNumber | EXIF | 62 | 0 | 62 | 0 | 0 | 0 | 0 |
| EXIF:FocalLength | EXIF | 62 | 0 | 62 | 0 | 0 | 0 | 0 |
| EXIF:FocalLengthIn35mmFilm | EXIF | 26 | 26 | 0 | 0 | 0 | 0 | 0 |
| EXIF:FocalPlaneResolutionUnit | EXIF | 16 | 16 | 0 | 0 | 0 | 0 | 0 |
| EXIF:FocalPlaneXResolution | EXIF | 16 | 0 | 16 | 0 | 0 | 0 | 0 |
| EXIF:FocalPlaneYResolution | EXIF | 16 | 0 | 16 | 0 | 0 | 0 | 0 |
| EXIF:GainControl | EXIF | 21 | 21 | 0 | 0 | 0 | 0 | 0 |
| EXIF:Gamma | EXIF | 0 | 0 | 0 | 0 | 1 | 0 | 0 |
| EXIF:GPSAltitude | EXIF | 7 | 0 | 7 | 0 | 0 | 0 | 0 |
| EXIF:GPSAltitudeRef | EXIF | 15 | 15 | 0 | 0 | 0 | 0 | 0 |
| EXIF:GPSAreaInformation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EXIF:GPSDateStamp | EXIF | 15 | 0 | 15 | 0 | 0 | 0 | 0 |
| EXIF:GPSDestBearing | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| EXIF:GPSDestBearingRef | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| EXIF:GPSDestDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EXIF:GPSDestDistanceRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EXIF:GPSDestLatitude | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| EXIF:GPSDestLatitudeRef | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| EXIF:GPSDestLongitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EXIF:GPSDestLongitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EXIF:GPSDifferential | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EXIF:GPSDOP | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| EXIF:GPSHPositioningError | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EXIF:GPSImgDirection | EXIF | 7 | 0 | 7 | 0 | 0 | 0 | 0 |
| EXIF:GPSImgDirectionRef | EXIF | 16 | 16 | 0 | 0 | 0 | 0 | 0 |
| EXIF:GPSInfoIFDPointer | EXIF | 26 | 0 | 0 | 0 | 0 | 26 | 0 |
| EXIF:GPSLatitude | EXIF | 20 | 19 | 0 | 0 | 0 | 1 | 0 |
| EXIF:GPSLatitudeRef | EXIF | 20 | 20 | 0 | 0 | 0 | 0 | 0 |
| EXIF:GPSLongitude | EXIF | 20 | 19 | 0 | 0 | 0 | 1 | 0 |
| EXIF:GPSLongitudeRef | EXIF | 20 | 20 | 0 | 0 | 0 | 0 | 0 |
| EXIF:GPSMapDatum | EXIF | 10 | 10 | 0 | 0 | 0 | 0 | 0 |
| EXIF:GPSMeasureMode | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EXIF:GPSProcessingMethod | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| EXIF:GPSSatellites | EXIF | 9 | 9 | 0 | 0 | 0 | 0 | 0 |
| EXIF:GPSSpeed | EXIF | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| EXIF:GPSSpeedRef | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| EXIF:GPSStatus | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EXIF:GPSTimeStamp | EXIF | 15 | 0 | 15 | 0 | 0 | 0 | 0 |
| EXIF:GPSTrack | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EXIF:GPSTrackRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EXIF:GPSVersionID | EXIF | 8 | 8 | 0 | 0 | 0 | 0 | 0 |
| EXIF:Humidity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EXIF:ImageDescription | EXIF | 31 | 31 | 0 | 0 | 0 | 0 | 0 |
| EXIF:ImageEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EXIF:ImageEditor | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EXIF:ImageLength | EXIF | 14 | 14 | 0 | 0 | 0 | 0 | 0 |
| EXIF:ImageTitle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EXIF:ImageUniqueID | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| EXIF:ImageWidth | EXIF | 14 | 14 | 0 | 0 | 0 | 0 | 0 |
| EXIF:InteroperabilityIFDPointer | EXIF | 47 | 0 | 0 | 0 | 0 | 47 | 0 |
| EXIF:InteroperabilityIndex | EXIF | 47 | 0 | 0 | 0 | 0 | 47 | 0 |
| EXIF:InteroperabilityVersion | EXIF | 47 | 0 | 0 | 0 | 0 | 47 | 0 |
| EXIF:ISOSpeed | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| EXIF:ISOSpeedLatitudeyyy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EXIF:ISOSpeedLatitudezzz | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EXIF:ISOSpeedRatings | EXIF | 50 | 50 | 0 | 0 | 0 | 0 | 0 |
| EXIF:JPEGInterchangeFormat | EXIF | 59 | 59 | 0 | 0 | 0 | 0 | 0 |
| EXIF:JPEGInterchangeFormatLength | EXIF | 59 | 59 | 0 | 0 | 0 | 0 | 0 |
| EXIF:LearningOptOutIn | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EXIF:LensMake | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| EXIF:LensModel | EXIF | 6 | 6 | 0 | 0 | 0 | 0 | 0 |
| EXIF:LensSerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EXIF:LensSpecification | EXIF | 6 | 0 | 0 | 0 | 0 | 6 | 0 |
| EXIF:LightSource | EXIF | 36 | 36 | 0 | 0 | 0 | 0 | 0 |
| EXIF:Make | EXIF | 63 | 54 | 9 | 0 | 0 | 0 | 0 |
| EXIF:MakerNote | EXIF | 46 | 0 | 0 | 0 | 0 | 46 | 0 |
| EXIF:MaxApertureValue | EXIF | 51 | 0 | 51 | 0 | 0 | 0 | 0 |
| EXIF:MetadataEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EXIF:MeteringMode | EXIF | 61 | 61 | 0 | 0 | 0 | 0 | 0 |
| EXIF:Model | EXIF | 63 | 53 | 10 | 0 | 0 | 0 | 0 |
| EXIF:NoiseReduction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EXIF:OECF | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EXIF:OffsetTime | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| EXIF:OffsetTimeDigitized | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| EXIF:OffsetTimeOriginal | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| EXIF:Orientation | EXIF | 88 | 88 | 0 | 0 | 1 | 0 | 0 |
| EXIF:Photographer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EXIF:PhotometricInterpretation | EXIF | 11 | 11 | 0 | 0 | 0 | 0 | 0 |
| EXIF:PixelXDimension | EXIF | 78 | 77 | 1 | 0 | 0 | 0 | 0 |
| EXIF:PixelYDimension | EXIF | 78 | 77 | 1 | 0 | 0 | 0 | 0 |
| EXIF:PlanarConfiguration | EXIF | 8 | 8 | 0 | 0 | 0 | 0 | 0 |
| EXIF:Pressure | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EXIF:PrimaryChromaticities | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| EXIF:RAWDevelopingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EXIF:RecommendedExposureIndex | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| EXIF:ReferenceBlackWhite | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| EXIF:RelatedImageFileFormat | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EXIF:RelatedImageLength | EXIF | 8 | 0 | 0 | 0 | 0 | 8 | 0 |
| EXIF:RelatedImageWidth | EXIF | 8 | 8 | 0 | 0 | 1 | 0 | 0 |
| EXIF:RelatedSoundFile | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| EXIF:ResolutionUnit | EXIF | 84 | 84 | 0 | 0 | 1 | 0 | 0 |
| EXIF:RowsPerStrip | EXIF | 10 | 10 | 0 | 0 | 0 | 0 | 0 |
| EXIF:SamplesPerPixel | EXIF | 11 | 11 | 0 | 0 | 0 | 0 | 0 |
| EXIF:Saturation | EXIF | 24 | 24 | 0 | 0 | 1 | 0 | 0 |
| EXIF:SceneCaptureType | EXIF | 39 | 39 | 0 | 0 | 2 | 0 | 0 |
| EXIF:SceneType | EXIF | 34 | 34 | 0 | 0 | 0 | 0 | 0 |
| EXIF:SensingMethod | EXIF | 26 | 26 | 0 | 0 | 0 | 0 | 0 |
| EXIF:SensitivityType | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| EXIF:ShadingCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EXIF:Sharpness | EXIF | 26 | 26 | 0 | 0 | 1 | 0 | 0 |
| EXIF:ShutterSpeedValue | EXIF | 30 | 0 | 30 | 0 | 0 | 0 | 0 |
| EXIF:Software | EXIF | 57 | 51 | 6 | 0 | 0 | 0 | 0 |
| EXIF:SourceExposureTimesOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EXIF:SourceImageNumberOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EXIF:SpatialFrequencyResponse | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EXIF:SpectralSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EXIF:StandardOutputSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EXIF:StripByteCounts | EXIF | 10 | 5 | 1 | 0 | 0 | 0 | 4 |
| EXIF:StripOffsets | EXIF | 10 | 5 | 1 | 0 | 0 | 0 | 4 |
| EXIF:SubjectArea | EXIF | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| EXIF:SubjectDistance | EXIF | 3 | 0 | 2 | 0 | 0 | 1 | 0 |
| EXIF:SubjectDistanceRange | EXIF | 17 | 17 | 0 | 0 | 1 | 0 | 0 |
| EXIF:SubjectLocation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EXIF:SubSecTime | EXIF | 8 | 2 | 6 | 0 | 0 | 0 | 0 |
| EXIF:SubSecTimeDigitized | EXIF | 9 | 4 | 5 | 0 | 0 | 0 | 0 |
| EXIF:SubSecTimeOriginal | EXIF | 9 | 4 | 5 | 0 | 1 | 0 | 0 |
| EXIF:Temperature | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EXIF:TransferFunction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EXIF:UserComment | EXIF | 30 | 0 | 18 | 0 | 0 | 12 | 0 |
| EXIF:WaterDepth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EXIF:WhiteBalance | EXIF | 45 | 45 | 0 | 0 | 2 | 0 | 0 |
| EXIF:WhitePoint | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| EXIF:XResolution | EXIF | 85 | 1 | 84 | 0 | 1 | 0 | 0 |
| EXIF:YCbCrCoefficients | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| EXIF:YCbCrPositioning | EXIF | 59 | 59 | 0 | 0 | 1 | 0 | 0 |
| EXIF:YCbCrSubSampling | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EXIF:YResolution | EXIF | 85 | 1 | 84 | 0 | 1 | 0 | 0 |
| IPTC:Byline | IPTC | 3 | 0 | 0 | 0 | 0 | 3 | 0 |
| IPTC:Caption | IPTC | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| IPTC:City | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| IPTC:CopyrightNotice | IPTC | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| IPTC:CountryCode | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| IPTC:DateCreated | IPTC | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| IPTC:Headline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| IPTC:Keywords | IPTC | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| IPTC:ObjectName | IPTC | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| XMP:XMP-dc:Creator | XMP | 6 | 6 | 0 | 0 | 0 | 0 | 0 |
| XMP:XMP-dc:Description | XMP | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| XMP:XMP-dc:Title | XMP | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| XMP:XMP-xmp:CreateDate | XMP | 14 | 0 | 14 | 0 | 1 | 0 | 0 |

## Per-producer results

| producer | found | matched | normalized | mismatched | missing local | missing reference | non-comparable |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Apple | 178 | 102 | 65 | 0 | 0 | 11 | 0 |
| Canon | 580 | 310 | 196 | 0 | 6 | 74 | 0 |
| Caplio | 39 | 22 | 13 | 0 | 0 | 4 | 0 |
| CASIO COMPUTER CO.,LTD | 50 | 29 | 15 | 0 | 0 | 6 | 0 |
| CASIO COMPUTER CO.,LTD. | 49 | 28 | 16 | 0 | 0 | 5 | 0 |
| Eastman Kodak Company | 39 | 22 | 13 | 0 | 0 | 4 | 0 |
| EASTMAN KODAK COMPANY | 101 | 58 | 33 | 0 | 0 | 10 | 0 |
| FUJIFILM | 240 | 125 | 92 | 0 | 0 | 23 | 0 |
| HMD Global | 62 | 42 | 16 | 0 | 0 | 4 | 0 |
| Jolla | 26 | 13 | 12 | 0 | 0 | 1 | 0 |
| KONICA MINOLTA | 54 | 32 | 16 | 0 | 0 | 6 | 0 |
| NIKON | 685 | 447 | 173 | 0 | 0 | 65 | 0 |
| NIKON CORPORATION | 235 | 151 | 70 | 0 | 2 | 14 | 0 |
| OLYMPUS CORPORATION | 53 | 32 | 16 | 0 | 0 | 5 | 0 |
| OLYMPUS IMAGING CORP. | 102 | 57 | 34 | 0 | 0 | 11 | 0 |
| OLYMPUS OPTICAL CO.,LTD | 43 | 24 | 14 | 0 | 0 | 5 | 0 |
| Panasonic | 53 | 34 | 14 | 0 | 0 | 5 | 0 |
| PENTAX Corporation | 37 | 22 | 14 | 0 | 8 | 1 | 0 |
| Polyphony Digital Inc. | 36 | 20 | 10 | 0 | 0 | 6 | 0 |
| RICOH | 38 | 16 | 16 | 0 | 0 | 6 | 0 |
| samsung | 30 | 21 | 6 | 0 | 0 | 3 | 0 |
| Samsung Techwin | 56 | 34 | 17 | 0 | 0 | 5 | 0 |
| SANYO Electric Co.,Ltd. | 78 | 42 | 29 | 0 | 0 | 7 | 0 |
| SONY | 239 | 148 | 68 | 0 | 0 | 23 | 0 |
| unknown | 578 | 421 | 102 | 0 | 8 | 45 | 10 |
| WWL | 41 | 22 | 15 | 0 | 0 | 4 | 0 |
| Xiaomi | 51 | 28 | 18 | 0 | 0 | 5 | 0 |

## Per-producer field results

| producer | field | family | found | matched | normalized | mismatched | missing local | missing reference | non-comparable |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Apple | block:EXIF | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Apple | block:ICC | ICC | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Apple | block:IPTC | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | block:JFIF | JFIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | block:XMP | XMP | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Apple | DIMENSIONS:height | DIMENSIONS | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Apple | DIMENSIONS:width | DIMENSIONS | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:Acceleration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:ApertureValue | EXIF | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| Apple | EXIF:Artist | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:BitsPerSample | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:BodySerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:BrightnessValue | EXIF | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| Apple | EXIF:CameraElevationAngle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:CameraFirmware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:CameraOwnerName | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:CFAPattern | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:ChromaticAberrationCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:ColorSpace | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:ComponentsConfiguration | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:CompositeImage | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:CompressedBitsPerPixel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:Compression | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:Contrast | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:Copyright | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:CustomRendered | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:DateTime | EXIF | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| Apple | EXIF:DateTimeDigitized | EXIF | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| Apple | EXIF:DateTimeOriginal | EXIF | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| Apple | EXIF:DevelopmentType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:DevelopmentTypeDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:DeviceSettingDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:DigitalZoomRatio | EXIF | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| Apple | EXIF:DistortionCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:ExifIFDPointer | EXIF | 3 | 0 | 0 | 0 | 0 | 3 | 0 |
| Apple | EXIF:ExifVersion | EXIF | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| Apple | EXIF:ExposureBiasValue | EXIF | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| Apple | EXIF:ExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:ExposureMode | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:ExposureProgram | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:ExposureTime | EXIF | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| Apple | EXIF:FileSource | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:Flash | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:FlashEnergy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:FlashpixVersion | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| Apple | EXIF:FNumber | EXIF | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| Apple | EXIF:FocalLength | EXIF | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| Apple | EXIF:FocalLengthIn35mmFilm | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:FocalPlaneResolutionUnit | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:FocalPlaneXResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:FocalPlaneYResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:GainControl | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:Gamma | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:GPSAltitude | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| Apple | EXIF:GPSAltitudeRef | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:GPSAreaInformation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:GPSDateStamp | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| Apple | EXIF:GPSDestBearing | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| Apple | EXIF:GPSDestBearingRef | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:GPSDestDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:GPSDestDistanceRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:GPSDestLatitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:GPSDestLatitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:GPSDestLongitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:GPSDestLongitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:GPSDifferential | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:GPSDOP | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:GPSHPositioningError | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:GPSImgDirection | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| Apple | EXIF:GPSImgDirectionRef | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:GPSInfoIFDPointer | EXIF | 2 | 0 | 0 | 0 | 0 | 2 | 0 |
| Apple | EXIF:GPSLatitude | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:GPSLatitudeRef | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:GPSLongitude | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:GPSLongitudeRef | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:GPSMapDatum | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:GPSMeasureMode | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:GPSProcessingMethod | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:GPSSatellites | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:GPSSpeed | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| Apple | EXIF:GPSSpeedRef | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:GPSStatus | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:GPSTimeStamp | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| Apple | EXIF:GPSTrack | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:GPSTrackRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:GPSVersionID | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:Humidity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:ImageDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:ImageEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:ImageEditor | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:ImageLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:ImageTitle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:ImageUniqueID | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:ImageWidth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:InteroperabilityIFDPointer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:InteroperabilityIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:InteroperabilityVersion | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:ISOSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:ISOSpeedLatitudeyyy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:ISOSpeedLatitudezzz | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:ISOSpeedRatings | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:JPEGInterchangeFormat | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:JPEGInterchangeFormatLength | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:LearningOptOutIn | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:LensMake | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:LensModel | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:LensSerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:LensSpecification | EXIF | 3 | 0 | 0 | 0 | 0 | 3 | 0 |
| Apple | EXIF:LightSource | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:Make | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:MakerNote | EXIF | 3 | 0 | 0 | 0 | 0 | 3 | 0 |
| Apple | EXIF:MaxApertureValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:MetadataEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:MeteringMode | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:Model | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:NoiseReduction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:OECF | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:OffsetTime | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:OffsetTimeDigitized | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:OffsetTimeOriginal | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:Orientation | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:Photographer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:PhotometricInterpretation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:PixelXDimension | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:PixelYDimension | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:PlanarConfiguration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:Pressure | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:PrimaryChromaticities | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:RAWDevelopingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:RecommendedExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:ReferenceBlackWhite | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:RelatedImageFileFormat | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:RelatedImageLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:RelatedImageWidth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:RelatedSoundFile | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:ResolutionUnit | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:RowsPerStrip | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:SamplesPerPixel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:Saturation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:SceneCaptureType | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:SceneType | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:SensingMethod | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:SensitivityType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:ShadingCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:Sharpness | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:ShutterSpeedValue | EXIF | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| Apple | EXIF:Software | EXIF | 3 | 1 | 2 | 0 | 0 | 0 | 0 |
| Apple | EXIF:SourceExposureTimesOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:SourceImageNumberOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:SpatialFrequencyResponse | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:SpectralSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:StandardOutputSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:StripByteCounts | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:StripOffsets | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:SubjectArea | EXIF | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| Apple | EXIF:SubjectDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:SubjectDistanceRange | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:SubjectLocation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:SubSecTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:SubSecTimeDigitized | EXIF | 3 | 1 | 2 | 0 | 0 | 0 | 0 |
| Apple | EXIF:SubSecTimeOriginal | EXIF | 3 | 1 | 2 | 0 | 0 | 0 | 0 |
| Apple | EXIF:Temperature | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:TransferFunction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:UserComment | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:WaterDepth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:WhiteBalance | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:WhitePoint | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:XResolution | EXIF | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| Apple | EXIF:YCbCrCoefficients | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:YCbCrPositioning | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:YCbCrSubSampling | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:YResolution | EXIF | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| Apple | IPTC:Byline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | IPTC:Caption | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | IPTC:City | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | IPTC:CopyrightNotice | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | IPTC:CountryCode | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | IPTC:DateCreated | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | IPTC:Headline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | IPTC:Keywords | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | IPTC:ObjectName | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | XMP:XMP-dc:Creator | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | XMP:XMP-dc:Description | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | XMP:XMP-dc:Title | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | XMP:XMP-xmp:CreateDate | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | block:EXIF | EXIF | 11 | 11 | 0 | 0 | 0 | 0 | 0 |
| Canon | block:ICC | ICC | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Canon | block:IPTC | IPTC | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Canon | block:JFIF | JFIF | 6 | 6 | 0 | 0 | 0 | 0 | 0 |
| Canon | block:XMP | XMP | 6 | 6 | 0 | 0 | 0 | 0 | 0 |
| Canon | DIMENSIONS:height | DIMENSIONS | 11 | 11 | 0 | 0 | 0 | 0 | 0 |
| Canon | DIMENSIONS:width | DIMENSIONS | 11 | 11 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:Acceleration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:ApertureValue | EXIF | 11 | 0 | 11 | 0 | 0 | 0 | 0 |
| Canon | EXIF:Artist | EXIF | 3 | 1 | 0 | 0 | 0 | 2 | 0 |
| Canon | EXIF:BitsPerSample | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:BodySerialNumber | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Canon | EXIF:BrightnessValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:CameraElevationAngle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:CameraFirmware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:CameraOwnerName | EXIF | 2 | 0 | 0 | 0 | 0 | 2 | 0 |
| Canon | EXIF:CFAPattern | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:ChromaticAberrationCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:ColorSpace | EXIF | 10 | 10 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:ComponentsConfiguration | EXIF | 10 | 9 | 1 | 0 | 0 | 0 | 0 |
| Canon | EXIF:CompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:CompressedBitsPerPixel | EXIF | 9 | 0 | 9 | 0 | 0 | 0 | 0 |
| Canon | EXIF:Compression | EXIF | 10 | 10 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:Contrast | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:Copyright | EXIF | 3 | 2 | 1 | 0 | 0 | 0 | 0 |
| Canon | EXIF:CustomRendered | EXIF | 9 | 9 | 0 | 0 | 1 | 0 | 0 |
| Canon | EXIF:DateTime | EXIF | 11 | 0 | 11 | 0 | 0 | 0 | 0 |
| Canon | EXIF:DateTimeDigitized | EXIF | 11 | 0 | 11 | 0 | 0 | 0 | 0 |
| Canon | EXIF:DateTimeOriginal | EXIF | 11 | 0 | 11 | 0 | 0 | 0 | 0 |
| Canon | EXIF:DevelopmentType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:DevelopmentTypeDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:DeviceSettingDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:DigitalZoomRatio | EXIF | 7 | 0 | 7 | 0 | 1 | 0 | 0 |
| Canon | EXIF:DistortionCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:ExifIFDPointer | EXIF | 11 | 0 | 0 | 0 | 0 | 11 | 0 |
| Canon | EXIF:ExifVersion | EXIF | 11 | 1 | 10 | 0 | 0 | 0 | 0 |
| Canon | EXIF:ExposureBiasValue | EXIF | 11 | 0 | 11 | 0 | 0 | 0 | 0 |
| Canon | EXIF:ExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:ExposureMode | EXIF | 9 | 9 | 0 | 0 | 1 | 0 | 0 |
| Canon | EXIF:ExposureProgram | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:ExposureTime | EXIF | 11 | 0 | 11 | 0 | 0 | 0 | 0 |
| Canon | EXIF:FileSource | EXIF | 9 | 9 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:Flash | EXIF | 11 | 11 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:FlashEnergy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:FlashpixVersion | EXIF | 10 | 1 | 9 | 0 | 0 | 0 | 0 |
| Canon | EXIF:FNumber | EXIF | 11 | 0 | 11 | 0 | 0 | 0 | 0 |
| Canon | EXIF:FocalLength | EXIF | 11 | 0 | 11 | 0 | 0 | 0 | 0 |
| Canon | EXIF:FocalLengthIn35mmFilm | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:FocalPlaneResolutionUnit | EXIF | 11 | 11 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:FocalPlaneXResolution | EXIF | 11 | 0 | 11 | 0 | 0 | 0 | 0 |
| Canon | EXIF:FocalPlaneYResolution | EXIF | 11 | 0 | 11 | 0 | 0 | 0 | 0 |
| Canon | EXIF:GainControl | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:Gamma | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:GPSAltitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:GPSAltitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:GPSAreaInformation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:GPSDateStamp | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:GPSDestBearing | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:GPSDestBearingRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:GPSDestDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:GPSDestDistanceRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:GPSDestLatitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:GPSDestLatitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:GPSDestLongitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:GPSDestLongitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:GPSDifferential | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:GPSDOP | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:GPSHPositioningError | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:GPSImgDirection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:GPSImgDirectionRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:GPSInfoIFDPointer | EXIF | 4 | 0 | 0 | 0 | 0 | 4 | 0 |
| Canon | EXIF:GPSLatitude | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| Canon | EXIF:GPSLatitudeRef | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:GPSLongitude | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| Canon | EXIF:GPSLongitudeRef | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:GPSMapDatum | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:GPSMeasureMode | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:GPSProcessingMethod | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:GPSSatellites | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:GPSSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:GPSSpeedRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:GPSStatus | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:GPSTimeStamp | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:GPSTrack | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:GPSTrackRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:GPSVersionID | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:Humidity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:ImageDescription | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:ImageEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:ImageEditor | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:ImageLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:ImageTitle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:ImageUniqueID | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:ImageWidth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:InteroperabilityIFDPointer | EXIF | 9 | 0 | 0 | 0 | 0 | 9 | 0 |
| Canon | EXIF:InteroperabilityIndex | EXIF | 9 | 0 | 0 | 0 | 0 | 9 | 0 |
| Canon | EXIF:InteroperabilityVersion | EXIF | 9 | 0 | 0 | 0 | 0 | 9 | 0 |
| Canon | EXIF:ISOSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:ISOSpeedLatitudeyyy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:ISOSpeedLatitudezzz | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:ISOSpeedRatings | EXIF | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:JPEGInterchangeFormat | EXIF | 10 | 10 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:JPEGInterchangeFormatLength | EXIF | 10 | 10 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:LearningOptOutIn | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:LensMake | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:LensModel | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:LensSerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:LensSpecification | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| Canon | EXIF:LightSource | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:Make | EXIF | 11 | 11 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:MakerNote | EXIF | 8 | 0 | 0 | 0 | 0 | 8 | 0 |
| Canon | EXIF:MaxApertureValue | EXIF | 10 | 0 | 10 | 0 | 0 | 0 | 0 |
| Canon | EXIF:MetadataEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:MeteringMode | EXIF | 11 | 11 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:Model | EXIF | 11 | 11 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:NoiseReduction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:OECF | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:OffsetTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:OffsetTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:OffsetTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:Orientation | EXIF | 8 | 8 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:Photographer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:PhotometricInterpretation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:PixelXDimension | EXIF | 10 | 10 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:PixelYDimension | EXIF | 10 | 10 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:PlanarConfiguration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:Pressure | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:PrimaryChromaticities | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:RAWDevelopingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:RecommendedExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:ReferenceBlackWhite | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:RelatedImageFileFormat | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:RelatedImageLength | EXIF | 7 | 0 | 0 | 0 | 0 | 7 | 0 |
| Canon | EXIF:RelatedImageWidth | EXIF | 7 | 7 | 0 | 0 | 1 | 0 | 0 |
| Canon | EXIF:RelatedSoundFile | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:ResolutionUnit | EXIF | 10 | 10 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:RowsPerStrip | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:SamplesPerPixel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:Saturation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:SceneCaptureType | EXIF | 9 | 9 | 0 | 0 | 1 | 0 | 0 |
| Canon | EXIF:SceneType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:SensingMethod | EXIF | 9 | 9 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:SensitivityType | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:ShadingCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:Sharpness | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:ShutterSpeedValue | EXIF | 11 | 0 | 11 | 0 | 0 | 0 | 0 |
| Canon | EXIF:Software | EXIF | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:SourceExposureTimesOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:SourceImageNumberOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:SpatialFrequencyResponse | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:SpectralSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:StandardOutputSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:StripByteCounts | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:StripOffsets | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:SubjectArea | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:SubjectDistance | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Canon | EXIF:SubjectDistanceRange | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:SubjectLocation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:SubSecTime | EXIF | 2 | 1 | 1 | 0 | 0 | 0 | 0 |
| Canon | EXIF:SubSecTimeDigitized | EXIF | 3 | 2 | 1 | 0 | 0 | 0 | 0 |
| Canon | EXIF:SubSecTimeOriginal | EXIF | 3 | 2 | 1 | 0 | 0 | 0 | 0 |
| Canon | EXIF:Temperature | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:TransferFunction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:UserComment | EXIF | 9 | 0 | 0 | 0 | 0 | 9 | 0 |
| Canon | EXIF:WaterDepth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:WhiteBalance | EXIF | 9 | 9 | 0 | 0 | 1 | 0 | 0 |
| Canon | EXIF:WhitePoint | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:XResolution | EXIF | 10 | 0 | 10 | 0 | 0 | 0 | 0 |
| Canon | EXIF:YCbCrCoefficients | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:YCbCrPositioning | EXIF | 10 | 10 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:YCbCrSubSampling | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:YResolution | EXIF | 10 | 0 | 10 | 0 | 0 | 0 | 0 |
| Canon | IPTC:Byline | IPTC | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| Canon | IPTC:Caption | IPTC | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Canon | IPTC:City | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | IPTC:CopyrightNotice | IPTC | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Canon | IPTC:CountryCode | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | IPTC:DateCreated | IPTC | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Canon | IPTC:Headline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | IPTC:Keywords | IPTC | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Canon | IPTC:ObjectName | IPTC | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Canon | XMP:XMP-dc:Creator | XMP | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Canon | XMP:XMP-dc:Description | XMP | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Canon | XMP:XMP-dc:Title | XMP | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Canon | XMP:XMP-xmp:CreateDate | XMP | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| Caplio | block:EXIF | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Caplio | block:ICC | ICC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | block:IPTC | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | block:JFIF | JFIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Caplio | block:XMP | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | DIMENSIONS:height | DIMENSIONS | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Caplio | DIMENSIONS:width | DIMENSIONS | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:Acceleration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:ApertureValue | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:Artist | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:BitsPerSample | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:BodySerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:BrightnessValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:CameraElevationAngle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:CameraFirmware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:CameraOwnerName | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:CFAPattern | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:ChromaticAberrationCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:ColorSpace | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:ComponentsConfiguration | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:CompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:CompressedBitsPerPixel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:Compression | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:Contrast | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:Copyright | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:CustomRendered | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:DateTime | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:DateTimeDigitized | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:DateTimeOriginal | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:DevelopmentType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:DevelopmentTypeDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:DeviceSettingDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:DigitalZoomRatio | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:DistortionCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:ExifIFDPointer | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| Caplio | EXIF:ExifVersion | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:ExposureBiasValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:ExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:ExposureMode | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:ExposureProgram | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:ExposureTime | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:FileSource | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:Flash | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:FlashEnergy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:FlashpixVersion | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:FNumber | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:FocalLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:FocalLengthIn35mmFilm | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:FocalPlaneResolutionUnit | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:FocalPlaneXResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:FocalPlaneYResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:GainControl | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:Gamma | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:GPSAltitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:GPSAltitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:GPSAreaInformation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:GPSDateStamp | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:GPSDestBearing | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:GPSDestBearingRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:GPSDestDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:GPSDestDistanceRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:GPSDestLatitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:GPSDestLatitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:GPSDestLongitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:GPSDestLongitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:GPSDifferential | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:GPSDOP | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:GPSHPositioningError | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:GPSImgDirection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:GPSImgDirectionRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:GPSInfoIFDPointer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:GPSLatitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:GPSLatitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:GPSLongitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:GPSLongitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:GPSMapDatum | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:GPSMeasureMode | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:GPSProcessingMethod | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:GPSSatellites | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:GPSSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:GPSSpeedRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:GPSStatus | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:GPSTimeStamp | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:GPSTrack | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:GPSTrackRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:GPSVersionID | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:Humidity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:ImageDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:ImageEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:ImageEditor | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:ImageLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:ImageTitle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:ImageUniqueID | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:ImageWidth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:InteroperabilityIFDPointer | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| Caplio | EXIF:InteroperabilityIndex | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| Caplio | EXIF:InteroperabilityVersion | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| Caplio | EXIF:ISOSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:ISOSpeedLatitudeyyy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:ISOSpeedLatitudezzz | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:ISOSpeedRatings | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:JPEGInterchangeFormat | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:JPEGInterchangeFormatLength | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:LearningOptOutIn | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:LensMake | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:LensModel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:LensSerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:LensSpecification | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:LightSource | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:Make | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:MakerNote | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:MaxApertureValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:MetadataEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:MeteringMode | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:Model | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:NoiseReduction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:OECF | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:OffsetTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:OffsetTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:OffsetTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:Orientation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:Photographer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:PhotometricInterpretation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:PixelXDimension | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:PixelYDimension | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:PlanarConfiguration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:Pressure | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:PrimaryChromaticities | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:RAWDevelopingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:RecommendedExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:ReferenceBlackWhite | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:RelatedImageFileFormat | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:RelatedImageLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:RelatedImageWidth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:RelatedSoundFile | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:ResolutionUnit | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:RowsPerStrip | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:SamplesPerPixel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:Saturation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:SceneCaptureType | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:SceneType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:SensingMethod | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:SensitivityType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:ShadingCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:Sharpness | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:ShutterSpeedValue | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:Software | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:SourceExposureTimesOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:SourceImageNumberOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:SpatialFrequencyResponse | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:SpectralSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:StandardOutputSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:StripByteCounts | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:StripOffsets | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:SubjectArea | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:SubjectDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:SubjectDistanceRange | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:SubjectLocation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:SubSecTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:SubSecTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:SubSecTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:Temperature | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:TransferFunction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:UserComment | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:WaterDepth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:WhiteBalance | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:WhitePoint | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:XResolution | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:YCbCrCoefficients | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:YCbCrPositioning | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:YCbCrSubSampling | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:YResolution | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Caplio | IPTC:Byline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | IPTC:Caption | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | IPTC:City | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | IPTC:CopyrightNotice | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | IPTC:CountryCode | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | IPTC:DateCreated | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | IPTC:Headline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | IPTC:Keywords | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | IPTC:ObjectName | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | XMP:XMP-dc:Creator | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | XMP:XMP-dc:Description | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | XMP:XMP-dc:Title | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | XMP:XMP-xmp:CreateDate | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | block:EXIF | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | block:ICC | ICC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | block:IPTC | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | block:JFIF | JFIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | block:XMP | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | DIMENSIONS:height | DIMENSIONS | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | DIMENSIONS:width | DIMENSIONS | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:Acceleration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:ApertureValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:Artist | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:BitsPerSample | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:BodySerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:BrightnessValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:CameraElevationAngle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:CameraFirmware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:CameraOwnerName | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:CFAPattern | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:ChromaticAberrationCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:ColorSpace | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:ComponentsConfiguration | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:CompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:CompressedBitsPerPixel | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:Compression | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:Contrast | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:Copyright | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:CustomRendered | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:DateTime | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:DateTimeDigitized | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:DateTimeOriginal | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:DevelopmentType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:DevelopmentTypeDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:DeviceSettingDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:DigitalZoomRatio | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:DistortionCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:ExifIFDPointer | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:ExifVersion | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:ExposureBiasValue | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:ExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:ExposureMode | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:ExposureProgram | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:ExposureTime | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:FileSource | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:Flash | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:FlashEnergy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:FlashpixVersion | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:FNumber | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:FocalLength | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:FocalLengthIn35mmFilm | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:FocalPlaneResolutionUnit | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:FocalPlaneXResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:FocalPlaneYResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:GainControl | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:Gamma | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:GPSAltitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:GPSAltitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:GPSAreaInformation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:GPSDateStamp | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:GPSDestBearing | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:GPSDestBearingRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:GPSDestDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:GPSDestDistanceRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:GPSDestLatitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:GPSDestLatitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:GPSDestLongitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:GPSDestLongitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:GPSDifferential | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:GPSDOP | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:GPSHPositioningError | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:GPSImgDirection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:GPSImgDirectionRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:GPSInfoIFDPointer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:GPSLatitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:GPSLatitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:GPSLongitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:GPSLongitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:GPSMapDatum | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:GPSMeasureMode | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:GPSProcessingMethod | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:GPSSatellites | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:GPSSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:GPSSpeedRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:GPSStatus | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:GPSTimeStamp | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:GPSTrack | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:GPSTrackRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:GPSVersionID | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:Humidity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:ImageDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:ImageEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:ImageEditor | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:ImageLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:ImageTitle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:ImageUniqueID | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:ImageWidth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:InteroperabilityIFDPointer | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:InteroperabilityIndex | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:InteroperabilityVersion | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:ISOSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:ISOSpeedLatitudeyyy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:ISOSpeedLatitudezzz | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:ISOSpeedRatings | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:JPEGInterchangeFormat | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:JPEGInterchangeFormatLength | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:LearningOptOutIn | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:LensMake | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:LensModel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:LensSerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:LensSpecification | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:LightSource | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:Make | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:MakerNote | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:MaxApertureValue | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:MetadataEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:MeteringMode | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:Model | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:NoiseReduction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:OECF | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:OffsetTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:OffsetTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:OffsetTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:Orientation | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:Photographer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:PhotometricInterpretation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:PixelXDimension | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:PixelYDimension | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:PlanarConfiguration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:Pressure | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:PrimaryChromaticities | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:RAWDevelopingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:RecommendedExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:ReferenceBlackWhite | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:RelatedImageFileFormat | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:RelatedImageLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:RelatedImageWidth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:RelatedSoundFile | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:ResolutionUnit | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:RowsPerStrip | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:SamplesPerPixel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:Saturation | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:SceneCaptureType | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:SceneType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:SensingMethod | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:SensitivityType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:ShadingCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:Sharpness | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:ShutterSpeedValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:Software | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:SourceExposureTimesOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:SourceImageNumberOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:SpatialFrequencyResponse | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:SpectralSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:StandardOutputSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:StripByteCounts | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:StripOffsets | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:SubjectArea | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:SubjectDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:SubjectDistanceRange | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:SubjectLocation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:SubSecTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:SubSecTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:SubSecTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:Temperature | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:TransferFunction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:UserComment | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:WaterDepth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:WhiteBalance | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:WhitePoint | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:XResolution | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:YCbCrCoefficients | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:YCbCrPositioning | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:YCbCrSubSampling | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | EXIF:YResolution | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | IPTC:Byline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | IPTC:Caption | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | IPTC:City | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | IPTC:CopyrightNotice | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | IPTC:CountryCode | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | IPTC:DateCreated | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | IPTC:Headline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | IPTC:Keywords | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | IPTC:ObjectName | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | XMP:XMP-dc:Creator | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | XMP:XMP-dc:Description | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | XMP:XMP-dc:Title | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD | XMP:XMP-xmp:CreateDate | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | block:EXIF | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | block:ICC | ICC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | block:IPTC | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | block:JFIF | JFIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | block:XMP | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | DIMENSIONS:height | DIMENSIONS | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | DIMENSIONS:width | DIMENSIONS | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:Acceleration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:ApertureValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:Artist | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:BitsPerSample | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:BodySerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:BrightnessValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:CameraElevationAngle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:CameraFirmware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:CameraOwnerName | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:CFAPattern | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:ChromaticAberrationCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:ColorSpace | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:ComponentsConfiguration | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:CompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:CompressedBitsPerPixel | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:Compression | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:Contrast | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:Copyright | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:CustomRendered | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:DateTime | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:DateTimeDigitized | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:DateTimeOriginal | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:DevelopmentType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:DevelopmentTypeDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:DeviceSettingDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:DigitalZoomRatio | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:DistortionCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:ExifIFDPointer | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:ExifVersion | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:ExposureBiasValue | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:ExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:ExposureMode | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:ExposureProgram | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:ExposureTime | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:FileSource | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:Flash | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:FlashEnergy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:FlashpixVersion | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:FNumber | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:FocalLength | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:FocalLengthIn35mmFilm | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:FocalPlaneResolutionUnit | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:FocalPlaneXResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:FocalPlaneYResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:GainControl | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:Gamma | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:GPSAltitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:GPSAltitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:GPSAreaInformation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:GPSDateStamp | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:GPSDestBearing | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:GPSDestBearingRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:GPSDestDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:GPSDestDistanceRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:GPSDestLatitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:GPSDestLatitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:GPSDestLongitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:GPSDestLongitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:GPSDifferential | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:GPSDOP | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:GPSHPositioningError | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:GPSImgDirection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:GPSImgDirectionRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:GPSInfoIFDPointer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:GPSLatitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:GPSLatitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:GPSLongitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:GPSLongitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:GPSMapDatum | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:GPSMeasureMode | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:GPSProcessingMethod | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:GPSSatellites | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:GPSSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:GPSSpeedRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:GPSStatus | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:GPSTimeStamp | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:GPSTrack | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:GPSTrackRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:GPSVersionID | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:Humidity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:ImageDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:ImageEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:ImageEditor | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:ImageLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:ImageTitle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:ImageUniqueID | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:ImageWidth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:InteroperabilityIFDPointer | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:InteroperabilityIndex | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:InteroperabilityVersion | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:ISOSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:ISOSpeedLatitudeyyy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:ISOSpeedLatitudezzz | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:ISOSpeedRatings | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:JPEGInterchangeFormat | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:JPEGInterchangeFormatLength | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:LearningOptOutIn | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:LensMake | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:LensModel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:LensSerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:LensSpecification | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:LightSource | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:Make | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:MakerNote | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:MaxApertureValue | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:MetadataEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:MeteringMode | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:Model | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:NoiseReduction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:OECF | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:OffsetTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:OffsetTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:OffsetTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:Orientation | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:Photographer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:PhotometricInterpretation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:PixelXDimension | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:PixelYDimension | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:PlanarConfiguration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:Pressure | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:PrimaryChromaticities | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:RAWDevelopingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:RecommendedExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:ReferenceBlackWhite | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:RelatedImageFileFormat | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:RelatedImageLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:RelatedImageWidth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:RelatedSoundFile | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:ResolutionUnit | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:RowsPerStrip | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:SamplesPerPixel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:Saturation | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:SceneCaptureType | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:SceneType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:SensingMethod | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:SensitivityType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:ShadingCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:Sharpness | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:ShutterSpeedValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:Software | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:SourceExposureTimesOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:SourceImageNumberOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:SpatialFrequencyResponse | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:SpectralSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:StandardOutputSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:StripByteCounts | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:StripOffsets | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:SubjectArea | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:SubjectDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:SubjectDistanceRange | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:SubjectLocation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:SubSecTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:SubSecTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:SubSecTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:Temperature | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:TransferFunction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:UserComment | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:WaterDepth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:WhiteBalance | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:WhitePoint | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:XResolution | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:YCbCrCoefficients | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:YCbCrPositioning | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:YCbCrSubSampling | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | EXIF:YResolution | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | IPTC:Byline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | IPTC:Caption | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | IPTC:City | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | IPTC:CopyrightNotice | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | IPTC:CountryCode | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | IPTC:DateCreated | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | IPTC:Headline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | IPTC:Keywords | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | IPTC:ObjectName | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | XMP:XMP-dc:Creator | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | XMP:XMP-dc:Description | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | XMP:XMP-dc:Title | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| CASIO COMPUTER CO.,LTD. | XMP:XMP-xmp:CreateDate | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | block:EXIF | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | block:ICC | ICC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | block:IPTC | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | block:JFIF | JFIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | block:XMP | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | DIMENSIONS:height | DIMENSIONS | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | DIMENSIONS:width | DIMENSIONS | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:Acceleration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:ApertureValue | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:Artist | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:BitsPerSample | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:BodySerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:BrightnessValue | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:CameraElevationAngle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:CameraFirmware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:CameraOwnerName | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:CFAPattern | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:ChromaticAberrationCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:ColorSpace | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:ComponentsConfiguration | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:CompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:CompressedBitsPerPixel | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| Eastman Kodak Company | EXIF:Compression | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:Contrast | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:Copyright | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:CustomRendered | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:DateTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:DateTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:DateTimeOriginal | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:DevelopmentType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:DevelopmentTypeDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:DeviceSettingDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:DigitalZoomRatio | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:DistortionCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:ExifIFDPointer | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| Eastman Kodak Company | EXIF:ExifVersion | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:ExposureBiasValue | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:ExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:ExposureMode | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:ExposureProgram | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:ExposureTime | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:FileSource | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:Flash | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:FlashEnergy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:FlashpixVersion | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:FNumber | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:FocalLength | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:FocalLengthIn35mmFilm | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:FocalPlaneResolutionUnit | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:FocalPlaneXResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:FocalPlaneYResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:GainControl | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:Gamma | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:GPSAltitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:GPSAltitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:GPSAreaInformation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:GPSDateStamp | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:GPSDestBearing | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:GPSDestBearingRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:GPSDestDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:GPSDestDistanceRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:GPSDestLatitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:GPSDestLatitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:GPSDestLongitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:GPSDestLongitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:GPSDifferential | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:GPSDOP | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:GPSHPositioningError | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:GPSImgDirection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:GPSImgDirectionRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:GPSInfoIFDPointer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:GPSLatitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:GPSLatitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:GPSLongitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:GPSLongitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:GPSMapDatum | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:GPSMeasureMode | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:GPSProcessingMethod | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:GPSSatellites | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:GPSSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:GPSSpeedRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:GPSStatus | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:GPSTimeStamp | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:GPSTrack | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:GPSTrackRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:GPSVersionID | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:Humidity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:ImageDescription | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:ImageEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:ImageEditor | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:ImageLength | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:ImageTitle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:ImageUniqueID | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:ImageWidth | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:InteroperabilityIFDPointer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:InteroperabilityIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:InteroperabilityVersion | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:ISOSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:ISOSpeedLatitudeyyy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:ISOSpeedLatitudezzz | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:ISOSpeedRatings | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:JPEGInterchangeFormat | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:JPEGInterchangeFormatLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:LearningOptOutIn | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:LensMake | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:LensModel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:LensSerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:LensSpecification | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:LightSource | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:Make | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:MakerNote | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| Eastman Kodak Company | EXIF:MaxApertureValue | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:MetadataEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:MeteringMode | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:Model | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:NoiseReduction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:OECF | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:OffsetTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:OffsetTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:OffsetTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:Orientation | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:Photographer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:PhotometricInterpretation | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:PixelXDimension | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:PixelYDimension | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:PlanarConfiguration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:Pressure | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:PrimaryChromaticities | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:RAWDevelopingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:RecommendedExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:ReferenceBlackWhite | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:RelatedImageFileFormat | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:RelatedImageLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:RelatedImageWidth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:RelatedSoundFile | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:ResolutionUnit | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:RowsPerStrip | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:SamplesPerPixel | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:Saturation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:SceneCaptureType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:SceneType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:SensingMethod | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:SensitivityType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:ShadingCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:Sharpness | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:ShutterSpeedValue | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:Software | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:SourceExposureTimesOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:SourceImageNumberOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:SpatialFrequencyResponse | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:SpectralSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:StandardOutputSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:StripByteCounts | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:StripOffsets | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:SubjectArea | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:SubjectDistance | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| Eastman Kodak Company | EXIF:SubjectDistanceRange | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:SubjectLocation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:SubSecTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:SubSecTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:SubSecTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:Temperature | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:TransferFunction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:UserComment | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:WaterDepth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:WhiteBalance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:WhitePoint | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:XResolution | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:YCbCrCoefficients | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:YCbCrPositioning | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:YCbCrSubSampling | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | EXIF:YResolution | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | IPTC:Byline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | IPTC:Caption | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | IPTC:City | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | IPTC:CopyrightNotice | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | IPTC:CountryCode | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | IPTC:DateCreated | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | IPTC:Headline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | IPTC:Keywords | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | IPTC:ObjectName | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | XMP:XMP-dc:Creator | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | XMP:XMP-dc:Description | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | XMP:XMP-dc:Title | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Eastman Kodak Company | XMP:XMP-xmp:CreateDate | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | block:EXIF | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | block:ICC | ICC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | block:IPTC | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | block:JFIF | JFIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | block:XMP | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | DIMENSIONS:height | DIMENSIONS | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | DIMENSIONS:width | DIMENSIONS | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:Acceleration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:ApertureValue | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:Artist | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:BitsPerSample | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:BodySerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:BrightnessValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:CameraElevationAngle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:CameraFirmware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:CameraOwnerName | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:CFAPattern | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:ChromaticAberrationCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:ColorSpace | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:ComponentsConfiguration | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:CompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:CompressedBitsPerPixel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:Compression | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:Contrast | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:Copyright | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:CustomRendered | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:DateTime | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:DateTimeDigitized | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:DateTimeOriginal | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:DevelopmentType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:DevelopmentTypeDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:DeviceSettingDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:DigitalZoomRatio | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:DistortionCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:ExifIFDPointer | EXIF | 2 | 0 | 0 | 0 | 0 | 2 | 0 |
| EASTMAN KODAK COMPANY | EXIF:ExifVersion | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:ExposureBiasValue | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:ExposureIndex | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:ExposureMode | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:ExposureProgram | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:ExposureTime | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:FileSource | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:Flash | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:FlashEnergy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:FlashpixVersion | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:FNumber | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:FocalLength | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:FocalLengthIn35mmFilm | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:FocalPlaneResolutionUnit | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:FocalPlaneXResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:FocalPlaneYResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:GainControl | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:Gamma | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:GPSAltitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:GPSAltitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:GPSAreaInformation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:GPSDateStamp | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:GPSDestBearing | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:GPSDestBearingRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:GPSDestDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:GPSDestDistanceRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:GPSDestLatitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:GPSDestLatitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:GPSDestLongitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:GPSDestLongitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:GPSDifferential | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:GPSDOP | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:GPSHPositioningError | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:GPSImgDirection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:GPSImgDirectionRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:GPSInfoIFDPointer | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| EASTMAN KODAK COMPANY | EXIF:GPSLatitude | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:GPSLatitudeRef | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:GPSLongitude | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:GPSLongitudeRef | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:GPSMapDatum | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:GPSMeasureMode | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:GPSProcessingMethod | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:GPSSatellites | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:GPSSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:GPSSpeedRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:GPSStatus | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:GPSTimeStamp | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:GPSTrack | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:GPSTrackRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:GPSVersionID | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:Humidity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:ImageDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:ImageEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:ImageEditor | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:ImageLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:ImageTitle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:ImageUniqueID | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:ImageWidth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:InteroperabilityIFDPointer | EXIF | 2 | 0 | 0 | 0 | 0 | 2 | 0 |
| EASTMAN KODAK COMPANY | EXIF:InteroperabilityIndex | EXIF | 2 | 0 | 0 | 0 | 0 | 2 | 0 |
| EASTMAN KODAK COMPANY | EXIF:InteroperabilityVersion | EXIF | 2 | 0 | 0 | 0 | 0 | 2 | 0 |
| EASTMAN KODAK COMPANY | EXIF:ISOSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:ISOSpeedLatitudeyyy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:ISOSpeedLatitudezzz | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:ISOSpeedRatings | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:JPEGInterchangeFormat | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:JPEGInterchangeFormatLength | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:LearningOptOutIn | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:LensMake | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:LensModel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:LensSerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:LensSpecification | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:LightSource | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:Make | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:MakerNote | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| EASTMAN KODAK COMPANY | EXIF:MaxApertureValue | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:MetadataEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:MeteringMode | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:Model | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:NoiseReduction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:OECF | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:OffsetTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:OffsetTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:OffsetTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:Orientation | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:Photographer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:PhotometricInterpretation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:PixelXDimension | EXIF | 2 | 1 | 1 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:PixelYDimension | EXIF | 2 | 1 | 1 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:PlanarConfiguration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:Pressure | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:PrimaryChromaticities | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:RAWDevelopingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:RecommendedExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:ReferenceBlackWhite | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:RelatedImageFileFormat | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:RelatedImageLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:RelatedImageWidth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:RelatedSoundFile | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:ResolutionUnit | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:RowsPerStrip | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:SamplesPerPixel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:Saturation | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:SceneCaptureType | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:SceneType | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:SensingMethod | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:SensitivityType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:ShadingCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:Sharpness | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:ShutterSpeedValue | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:Software | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:SourceExposureTimesOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:SourceImageNumberOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:SpatialFrequencyResponse | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:SpectralSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:StandardOutputSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:StripByteCounts | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:StripOffsets | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:SubjectArea | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:SubjectDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:SubjectDistanceRange | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:SubjectLocation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:SubSecTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:SubSecTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:SubSecTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:Temperature | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:TransferFunction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:UserComment | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:WaterDepth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:WhiteBalance | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:WhitePoint | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:XResolution | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:YCbCrCoefficients | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:YCbCrPositioning | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:YCbCrSubSampling | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | EXIF:YResolution | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | IPTC:Byline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | IPTC:Caption | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | IPTC:City | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | IPTC:CopyrightNotice | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | IPTC:CountryCode | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | IPTC:DateCreated | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | IPTC:Headline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | IPTC:Keywords | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | IPTC:ObjectName | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | XMP:XMP-dc:Creator | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | XMP:XMP-dc:Description | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | XMP:XMP-dc:Title | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EASTMAN KODAK COMPANY | XMP:XMP-xmp:CreateDate | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | block:EXIF | EXIF | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | block:ICC | ICC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | block:IPTC | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | block:JFIF | JFIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | block:XMP | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | DIMENSIONS:height | DIMENSIONS | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | DIMENSIONS:width | DIMENSIONS | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:Acceleration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:ApertureValue | EXIF | 5 | 0 | 5 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:Artist | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:BitsPerSample | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:BodySerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:BrightnessValue | EXIF | 5 | 0 | 5 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:CameraElevationAngle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:CameraFirmware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:CameraOwnerName | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:CFAPattern | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:ChromaticAberrationCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:ColorSpace | EXIF | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:ComponentsConfiguration | EXIF | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:CompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:CompressedBitsPerPixel | EXIF | 5 | 0 | 5 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:Compression | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:Contrast | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:Copyright | EXIF | 5 | 0 | 5 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:CustomRendered | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:DateTime | EXIF | 5 | 0 | 5 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:DateTimeDigitized | EXIF | 5 | 0 | 5 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:DateTimeOriginal | EXIF | 5 | 0 | 5 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:DevelopmentType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:DevelopmentTypeDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:DeviceSettingDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:DigitalZoomRatio | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:DistortionCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:ExifIFDPointer | EXIF | 5 | 0 | 0 | 0 | 0 | 5 | 0 |
| FUJIFILM | EXIF:ExifVersion | EXIF | 5 | 0 | 5 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:ExposureBiasValue | EXIF | 5 | 0 | 5 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:ExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:ExposureMode | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:ExposureProgram | EXIF | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:ExposureTime | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:FileSource | EXIF | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:Flash | EXIF | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:FlashEnergy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:FlashpixVersion | EXIF | 5 | 0 | 5 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:FNumber | EXIF | 5 | 0 | 5 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:FocalLength | EXIF | 5 | 0 | 5 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:FocalLengthIn35mmFilm | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:FocalPlaneResolutionUnit | EXIF | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:FocalPlaneXResolution | EXIF | 5 | 0 | 5 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:FocalPlaneYResolution | EXIF | 5 | 0 | 5 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:GainControl | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:Gamma | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:GPSAltitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:GPSAltitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:GPSAreaInformation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:GPSDateStamp | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:GPSDestBearing | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:GPSDestBearingRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:GPSDestDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:GPSDestDistanceRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:GPSDestLatitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:GPSDestLatitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:GPSDestLongitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:GPSDestLongitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:GPSDifferential | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:GPSDOP | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:GPSHPositioningError | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:GPSImgDirection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:GPSImgDirectionRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:GPSInfoIFDPointer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:GPSLatitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:GPSLatitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:GPSLongitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:GPSLongitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:GPSMapDatum | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:GPSMeasureMode | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:GPSProcessingMethod | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:GPSSatellites | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:GPSSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:GPSSpeedRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:GPSStatus | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:GPSTimeStamp | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:GPSTrack | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:GPSTrackRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:GPSVersionID | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:Humidity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:ImageDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:ImageEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:ImageEditor | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:ImageLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:ImageTitle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:ImageUniqueID | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:ImageWidth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:InteroperabilityIFDPointer | EXIF | 5 | 0 | 0 | 0 | 0 | 5 | 0 |
| FUJIFILM | EXIF:InteroperabilityIndex | EXIF | 5 | 0 | 0 | 0 | 0 | 5 | 0 |
| FUJIFILM | EXIF:InteroperabilityVersion | EXIF | 5 | 0 | 0 | 0 | 0 | 5 | 0 |
| FUJIFILM | EXIF:ISOSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:ISOSpeedLatitudeyyy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:ISOSpeedLatitudezzz | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:ISOSpeedRatings | EXIF | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:JPEGInterchangeFormat | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:JPEGInterchangeFormatLength | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:LearningOptOutIn | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:LensMake | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:LensModel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:LensSerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:LensSpecification | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:LightSource | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:Make | EXIF | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:MakerNote | EXIF | 3 | 0 | 0 | 0 | 0 | 3 | 0 |
| FUJIFILM | EXIF:MaxApertureValue | EXIF | 5 | 0 | 5 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:MetadataEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:MeteringMode | EXIF | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:Model | EXIF | 5 | 4 | 1 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:NoiseReduction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:OECF | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:OffsetTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:OffsetTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:OffsetTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:Orientation | EXIF | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:Photographer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:PhotometricInterpretation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:PixelXDimension | EXIF | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:PixelYDimension | EXIF | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:PlanarConfiguration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:Pressure | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:PrimaryChromaticities | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:RAWDevelopingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:RecommendedExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:ReferenceBlackWhite | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:RelatedImageFileFormat | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:RelatedImageLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:RelatedImageWidth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:RelatedSoundFile | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:ResolutionUnit | EXIF | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:RowsPerStrip | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:SamplesPerPixel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:Saturation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:SceneCaptureType | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:SceneType | EXIF | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:SensingMethod | EXIF | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:SensitivityType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:ShadingCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:Sharpness | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:ShutterSpeedValue | EXIF | 5 | 0 | 5 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:Software | EXIF | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:SourceExposureTimesOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:SourceImageNumberOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:SpatialFrequencyResponse | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:SpectralSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:StandardOutputSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:StripByteCounts | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:StripOffsets | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:SubjectArea | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:SubjectDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:SubjectDistanceRange | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:SubjectLocation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:SubSecTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:SubSecTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:SubSecTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:Temperature | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:TransferFunction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:UserComment | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:WaterDepth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:WhiteBalance | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:WhitePoint | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:XResolution | EXIF | 5 | 0 | 5 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:YCbCrCoefficients | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:YCbCrPositioning | EXIF | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:YCbCrSubSampling | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:YResolution | EXIF | 5 | 0 | 5 | 0 | 0 | 0 | 0 |
| FUJIFILM | IPTC:Byline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | IPTC:Caption | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | IPTC:City | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | IPTC:CopyrightNotice | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | IPTC:CountryCode | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | IPTC:DateCreated | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | IPTC:Headline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | IPTC:Keywords | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | IPTC:ObjectName | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | XMP:XMP-dc:Creator | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | XMP:XMP-dc:Description | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | XMP:XMP-dc:Title | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | XMP:XMP-xmp:CreateDate | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | block:EXIF | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | block:ICC | ICC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | block:IPTC | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | block:JFIF | JFIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | block:XMP | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | DIMENSIONS:height | DIMENSIONS | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | DIMENSIONS:width | DIMENSIONS | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:Acceleration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:ApertureValue | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:Artist | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:BitsPerSample | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:BodySerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:BrightnessValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:CameraElevationAngle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:CameraFirmware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:CameraOwnerName | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:CFAPattern | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:ChromaticAberrationCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:ColorSpace | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:ComponentsConfiguration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:CompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:CompressedBitsPerPixel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:Compression | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:Contrast | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:Copyright | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:CustomRendered | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:DateTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:DateTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:DateTimeOriginal | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:DevelopmentType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:DevelopmentTypeDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:DeviceSettingDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:DigitalZoomRatio | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:DistortionCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:ExifIFDPointer | EXIF | 2 | 0 | 0 | 0 | 0 | 2 | 0 |
| HMD Global | EXIF:ExifVersion | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:ExposureBiasValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:ExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:ExposureMode | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:ExposureProgram | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:ExposureTime | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:FileSource | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:Flash | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:FlashEnergy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:FlashpixVersion | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:FNumber | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:FocalLength | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:FocalLengthIn35mmFilm | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:FocalPlaneResolutionUnit | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:FocalPlaneXResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:FocalPlaneYResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:GainControl | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:Gamma | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:GPSAltitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:GPSAltitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:GPSAreaInformation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:GPSDateStamp | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:GPSDestBearing | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:GPSDestBearingRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:GPSDestDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:GPSDestDistanceRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:GPSDestLatitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:GPSDestLatitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:GPSDestLongitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:GPSDestLongitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:GPSDifferential | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:GPSDOP | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:GPSHPositioningError | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:GPSImgDirection | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:GPSImgDirectionRef | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:GPSInfoIFDPointer | EXIF | 2 | 0 | 0 | 0 | 0 | 2 | 0 |
| HMD Global | EXIF:GPSLatitude | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:GPSLatitudeRef | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:GPSLongitude | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:GPSLongitudeRef | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:GPSMapDatum | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:GPSMeasureMode | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:GPSProcessingMethod | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:GPSSatellites | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:GPSSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:GPSSpeedRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:GPSStatus | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:GPSTimeStamp | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:GPSTrack | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:GPSTrackRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:GPSVersionID | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:Humidity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:ImageDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:ImageEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:ImageEditor | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:ImageLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:ImageTitle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:ImageUniqueID | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:ImageWidth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:InteroperabilityIFDPointer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:InteroperabilityIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:InteroperabilityVersion | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:ISOSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:ISOSpeedLatitudeyyy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:ISOSpeedLatitudezzz | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:ISOSpeedRatings | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:JPEGInterchangeFormat | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:JPEGInterchangeFormatLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:LearningOptOutIn | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:LensMake | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:LensModel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:LensSerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:LensSpecification | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:LightSource | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:Make | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:MakerNote | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:MaxApertureValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:MetadataEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:MeteringMode | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:Model | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:NoiseReduction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:OECF | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:OffsetTime | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:OffsetTimeDigitized | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:OffsetTimeOriginal | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:Orientation | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:Photographer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:PhotometricInterpretation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:PixelXDimension | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:PixelYDimension | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:PlanarConfiguration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:Pressure | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:PrimaryChromaticities | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:RAWDevelopingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:RecommendedExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:ReferenceBlackWhite | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:RelatedImageFileFormat | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:RelatedImageLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:RelatedImageWidth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:RelatedSoundFile | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:ResolutionUnit | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:RowsPerStrip | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:SamplesPerPixel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:Saturation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:SceneCaptureType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:SceneType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:SensingMethod | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:SensitivityType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:ShadingCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:Sharpness | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:ShutterSpeedValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:Software | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:SourceExposureTimesOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:SourceImageNumberOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:SpatialFrequencyResponse | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:SpectralSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:StandardOutputSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:StripByteCounts | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:StripOffsets | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:SubjectArea | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:SubjectDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:SubjectDistanceRange | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:SubjectLocation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:SubSecTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:SubSecTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:SubSecTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:Temperature | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:TransferFunction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:UserComment | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:WaterDepth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:WhiteBalance | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:WhitePoint | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:XResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:YCbCrCoefficients | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:YCbCrPositioning | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:YCbCrSubSampling | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | EXIF:YResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | IPTC:Byline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | IPTC:Caption | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | IPTC:City | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | IPTC:CopyrightNotice | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | IPTC:CountryCode | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | IPTC:DateCreated | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | IPTC:Headline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | IPTC:Keywords | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | IPTC:ObjectName | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | XMP:XMP-dc:Creator | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | XMP:XMP-dc:Description | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | XMP:XMP-dc:Title | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HMD Global | XMP:XMP-xmp:CreateDate | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | block:EXIF | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Jolla | block:ICC | ICC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | block:IPTC | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | block:JFIF | JFIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | block:XMP | XMP | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Jolla | DIMENSIONS:height | DIMENSIONS | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Jolla | DIMENSIONS:width | DIMENSIONS | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:Acceleration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:ApertureValue | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:Artist | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:BitsPerSample | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:BodySerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:BrightnessValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:CameraElevationAngle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:CameraFirmware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:CameraOwnerName | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:CFAPattern | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:ChromaticAberrationCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:ColorSpace | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:ComponentsConfiguration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:CompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:CompressedBitsPerPixel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:Compression | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:Contrast | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:Copyright | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:CustomRendered | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:DateTime | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:DateTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:DateTimeOriginal | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:DevelopmentType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:DevelopmentTypeDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:DeviceSettingDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:DigitalZoomRatio | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:DistortionCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:ExifIFDPointer | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| Jolla | EXIF:ExifVersion | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:ExposureBiasValue | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:ExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:ExposureMode | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:ExposureProgram | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:ExposureTime | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:FileSource | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:Flash | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:FlashEnergy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:FlashpixVersion | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:FNumber | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:FocalLength | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:FocalLengthIn35mmFilm | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:FocalPlaneResolutionUnit | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:FocalPlaneXResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:FocalPlaneYResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:GainControl | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:Gamma | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:GPSAltitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:GPSAltitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:GPSAreaInformation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:GPSDateStamp | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:GPSDestBearing | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:GPSDestBearingRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:GPSDestDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:GPSDestDistanceRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:GPSDestLatitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:GPSDestLatitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:GPSDestLongitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:GPSDestLongitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:GPSDifferential | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:GPSDOP | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:GPSHPositioningError | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:GPSImgDirection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:GPSImgDirectionRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:GPSInfoIFDPointer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:GPSLatitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:GPSLatitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:GPSLongitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:GPSLongitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:GPSMapDatum | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:GPSMeasureMode | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:GPSProcessingMethod | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:GPSSatellites | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:GPSSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:GPSSpeedRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:GPSStatus | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:GPSTimeStamp | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:GPSTrack | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:GPSTrackRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:GPSVersionID | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:Humidity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:ImageDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:ImageEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:ImageEditor | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:ImageLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:ImageTitle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:ImageUniqueID | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:ImageWidth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:InteroperabilityIFDPointer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:InteroperabilityIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:InteroperabilityVersion | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:ISOSpeed | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:ISOSpeedLatitudeyyy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:ISOSpeedLatitudezzz | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:ISOSpeedRatings | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:JPEGInterchangeFormat | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:JPEGInterchangeFormatLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:LearningOptOutIn | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:LensMake | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:LensModel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:LensSerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:LensSpecification | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:LightSource | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:Make | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:MakerNote | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:MaxApertureValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:MetadataEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:MeteringMode | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:Model | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:NoiseReduction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:OECF | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:OffsetTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:OffsetTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:OffsetTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:Orientation | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:Photographer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:PhotometricInterpretation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:PixelXDimension | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:PixelYDimension | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:PlanarConfiguration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:Pressure | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:PrimaryChromaticities | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:RAWDevelopingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:RecommendedExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:ReferenceBlackWhite | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:RelatedImageFileFormat | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:RelatedImageLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:RelatedImageWidth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:RelatedSoundFile | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:ResolutionUnit | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:RowsPerStrip | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:SamplesPerPixel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:Saturation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:SceneCaptureType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:SceneType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:SensingMethod | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:SensitivityType | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:ShadingCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:Sharpness | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:ShutterSpeedValue | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:Software | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:SourceExposureTimesOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:SourceImageNumberOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:SpatialFrequencyResponse | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:SpectralSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:StandardOutputSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:StripByteCounts | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:StripOffsets | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:SubjectArea | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:SubjectDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:SubjectDistanceRange | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:SubjectLocation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:SubSecTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:SubSecTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:SubSecTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:Temperature | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:TransferFunction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:UserComment | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:WaterDepth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:WhiteBalance | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:WhitePoint | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:XResolution | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:YCbCrCoefficients | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:YCbCrPositioning | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:YCbCrSubSampling | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | EXIF:YResolution | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Jolla | IPTC:Byline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | IPTC:Caption | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | IPTC:City | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | IPTC:CopyrightNotice | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | IPTC:CountryCode | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | IPTC:DateCreated | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | IPTC:Headline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | IPTC:Keywords | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | IPTC:ObjectName | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | XMP:XMP-dc:Creator | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | XMP:XMP-dc:Description | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | XMP:XMP-dc:Title | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Jolla | XMP:XMP-xmp:CreateDate | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | block:EXIF | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | block:ICC | ICC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | block:IPTC | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | block:JFIF | JFIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | block:XMP | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | DIMENSIONS:height | DIMENSIONS | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | DIMENSIONS:width | DIMENSIONS | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:Acceleration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:ApertureValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:Artist | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:BitsPerSample | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:BodySerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:BrightnessValue | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:CameraElevationAngle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:CameraFirmware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:CameraOwnerName | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:CFAPattern | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:ChromaticAberrationCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:ColorSpace | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:ComponentsConfiguration | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:CompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:CompressedBitsPerPixel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:Compression | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:Contrast | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:Copyright | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:CustomRendered | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:DateTime | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:DateTimeDigitized | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:DateTimeOriginal | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:DevelopmentType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:DevelopmentTypeDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:DeviceSettingDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:DigitalZoomRatio | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:DistortionCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:ExifIFDPointer | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| KONICA MINOLTA | EXIF:ExifVersion | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:ExposureBiasValue | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:ExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:ExposureMode | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:ExposureProgram | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:ExposureTime | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:FileSource | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:Flash | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:FlashEnergy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:FlashpixVersion | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:FNumber | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:FocalLength | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:FocalLengthIn35mmFilm | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:FocalPlaneResolutionUnit | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:FocalPlaneXResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:FocalPlaneYResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:GainControl | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:Gamma | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:GPSAltitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:GPSAltitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:GPSAreaInformation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:GPSDateStamp | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:GPSDestBearing | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:GPSDestBearingRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:GPSDestDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:GPSDestDistanceRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:GPSDestLatitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:GPSDestLatitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:GPSDestLongitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:GPSDestLongitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:GPSDifferential | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:GPSDOP | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:GPSHPositioningError | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:GPSImgDirection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:GPSImgDirectionRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:GPSInfoIFDPointer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:GPSLatitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:GPSLatitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:GPSLongitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:GPSLongitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:GPSMapDatum | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:GPSMeasureMode | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:GPSProcessingMethod | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:GPSSatellites | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:GPSSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:GPSSpeedRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:GPSStatus | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:GPSTimeStamp | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:GPSTrack | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:GPSTrackRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:GPSVersionID | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:Humidity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:ImageDescription | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:ImageEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:ImageEditor | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:ImageLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:ImageTitle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:ImageUniqueID | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:ImageWidth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:InteroperabilityIFDPointer | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| KONICA MINOLTA | EXIF:InteroperabilityIndex | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| KONICA MINOLTA | EXIF:InteroperabilityVersion | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| KONICA MINOLTA | EXIF:ISOSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:ISOSpeedLatitudeyyy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:ISOSpeedLatitudezzz | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:ISOSpeedRatings | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:JPEGInterchangeFormat | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:JPEGInterchangeFormatLength | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:LearningOptOutIn | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:LensMake | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:LensModel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:LensSerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:LensSpecification | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:LightSource | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:Make | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:MakerNote | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| KONICA MINOLTA | EXIF:MaxApertureValue | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:MetadataEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:MeteringMode | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:Model | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:NoiseReduction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:OECF | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:OffsetTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:OffsetTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:OffsetTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:Orientation | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:Photographer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:PhotometricInterpretation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:PixelXDimension | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:PixelYDimension | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:PlanarConfiguration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:Pressure | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:PrimaryChromaticities | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:RAWDevelopingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:RecommendedExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:ReferenceBlackWhite | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:RelatedImageFileFormat | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:RelatedImageLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:RelatedImageWidth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:RelatedSoundFile | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:ResolutionUnit | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:RowsPerStrip | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:SamplesPerPixel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:Saturation | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:SceneCaptureType | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:SceneType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:SensingMethod | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:SensitivityType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:ShadingCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:Sharpness | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:ShutterSpeedValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:Software | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:SourceExposureTimesOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:SourceImageNumberOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:SpatialFrequencyResponse | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:SpectralSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:StandardOutputSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:StripByteCounts | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:StripOffsets | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:SubjectArea | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:SubjectDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:SubjectDistanceRange | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:SubjectLocation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:SubSecTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:SubSecTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:SubSecTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:Temperature | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:TransferFunction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:UserComment | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| KONICA MINOLTA | EXIF:WaterDepth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:WhiteBalance | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:WhitePoint | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:XResolution | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:YCbCrCoefficients | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:YCbCrPositioning | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:YCbCrSubSampling | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:YResolution | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | IPTC:Byline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | IPTC:Caption | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | IPTC:City | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | IPTC:CopyrightNotice | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | IPTC:CountryCode | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | IPTC:DateCreated | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | IPTC:Headline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | IPTC:Keywords | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | IPTC:ObjectName | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | XMP:XMP-dc:Creator | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | XMP:XMP-dc:Description | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | XMP:XMP-dc:Title | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | XMP:XMP-xmp:CreateDate | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | block:EXIF | EXIF | 11 | 11 | 0 | 0 | 0 | 0 | 0 |
| NIKON | block:ICC | ICC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | block:IPTC | IPTC | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| NIKON | block:JFIF | JFIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| NIKON | block:XMP | XMP | 9 | 9 | 0 | 0 | 0 | 0 | 0 |
| NIKON | DIMENSIONS:height | DIMENSIONS | 11 | 11 | 0 | 0 | 0 | 0 | 0 |
| NIKON | DIMENSIONS:width | DIMENSIONS | 11 | 11 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:Acceleration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:ApertureValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:Artist | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:BitsPerSample | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:BodySerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:BrightnessValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:CameraElevationAngle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:CameraFirmware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:CameraOwnerName | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:CFAPattern | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:ChromaticAberrationCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:ColorSpace | EXIF | 11 | 11 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:ComponentsConfiguration | EXIF | 11 | 11 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:CompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:CompressedBitsPerPixel | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:Compression | EXIF | 11 | 11 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:Contrast | EXIF | 10 | 10 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:Copyright | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:CustomRendered | EXIF | 10 | 10 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:DateTime | EXIF | 11 | 0 | 11 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:DateTimeDigitized | EXIF | 11 | 0 | 11 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:DateTimeOriginal | EXIF | 11 | 0 | 11 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:DevelopmentType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:DevelopmentTypeDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:DeviceSettingDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:DigitalZoomRatio | EXIF | 10 | 0 | 10 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:DistortionCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:ExifIFDPointer | EXIF | 11 | 0 | 0 | 0 | 0 | 11 | 0 |
| NIKON | EXIF:ExifVersion | EXIF | 11 | 0 | 11 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:ExposureBiasValue | EXIF | 11 | 0 | 11 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:ExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:ExposureMode | EXIF | 10 | 10 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:ExposureProgram | EXIF | 11 | 11 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:ExposureTime | EXIF | 11 | 0 | 11 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:FileSource | EXIF | 11 | 11 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:Flash | EXIF | 11 | 11 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:FlashEnergy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:FlashpixVersion | EXIF | 11 | 0 | 11 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:FNumber | EXIF | 11 | 0 | 11 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:FocalLength | EXIF | 11 | 0 | 11 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:FocalLengthIn35mmFilm | EXIF | 10 | 10 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:FocalPlaneResolutionUnit | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:FocalPlaneXResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:FocalPlaneYResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:GainControl | EXIF | 10 | 10 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:Gamma | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:GPSAltitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:GPSAltitudeRef | EXIF | 9 | 9 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:GPSAreaInformation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:GPSDateStamp | EXIF | 9 | 0 | 9 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:GPSDestBearing | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:GPSDestBearingRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:GPSDestDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:GPSDestDistanceRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:GPSDestLatitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:GPSDestLatitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:GPSDestLongitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:GPSDestLongitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:GPSDifferential | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:GPSDOP | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:GPSHPositioningError | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:GPSImgDirection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:GPSImgDirectionRef | EXIF | 9 | 9 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:GPSInfoIFDPointer | EXIF | 9 | 0 | 0 | 0 | 0 | 9 | 0 |
| NIKON | EXIF:GPSLatitude | EXIF | 9 | 9 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:GPSLatitudeRef | EXIF | 9 | 9 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:GPSLongitude | EXIF | 9 | 9 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:GPSLongitudeRef | EXIF | 9 | 9 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:GPSMapDatum | EXIF | 9 | 9 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:GPSMeasureMode | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:GPSProcessingMethod | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:GPSSatellites | EXIF | 9 | 9 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:GPSSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:GPSSpeedRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:GPSStatus | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:GPSTimeStamp | EXIF | 9 | 0 | 9 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:GPSTrack | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:GPSTrackRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:GPSVersionID | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:Humidity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:ImageDescription | EXIF | 11 | 11 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:ImageEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:ImageEditor | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:ImageLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:ImageTitle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:ImageUniqueID | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:ImageWidth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:InteroperabilityIFDPointer | EXIF | 11 | 0 | 0 | 0 | 0 | 11 | 0 |
| NIKON | EXIF:InteroperabilityIndex | EXIF | 11 | 0 | 0 | 0 | 0 | 11 | 0 |
| NIKON | EXIF:InteroperabilityVersion | EXIF | 11 | 0 | 0 | 0 | 0 | 11 | 0 |
| NIKON | EXIF:ISOSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:ISOSpeedLatitudeyyy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:ISOSpeedLatitudezzz | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:ISOSpeedRatings | EXIF | 11 | 11 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:JPEGInterchangeFormat | EXIF | 11 | 11 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:JPEGInterchangeFormatLength | EXIF | 11 | 11 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:LearningOptOutIn | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:LensMake | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:LensModel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:LensSerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:LensSpecification | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:LightSource | EXIF | 11 | 11 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:Make | EXIF | 11 | 11 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:MakerNote | EXIF | 11 | 0 | 0 | 0 | 0 | 11 | 0 |
| NIKON | EXIF:MaxApertureValue | EXIF | 11 | 0 | 11 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:MetadataEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:MeteringMode | EXIF | 11 | 11 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:Model | EXIF | 11 | 11 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:NoiseReduction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:OECF | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:OffsetTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:OffsetTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:OffsetTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:Orientation | EXIF | 11 | 11 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:Photographer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:PhotometricInterpretation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:PixelXDimension | EXIF | 11 | 11 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:PixelYDimension | EXIF | 11 | 11 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:PlanarConfiguration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:Pressure | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:PrimaryChromaticities | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:RAWDevelopingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:RecommendedExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:ReferenceBlackWhite | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:RelatedImageFileFormat | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:RelatedImageLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:RelatedImageWidth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:RelatedSoundFile | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:ResolutionUnit | EXIF | 11 | 11 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:RowsPerStrip | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:SamplesPerPixel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:Saturation | EXIF | 10 | 10 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:SceneCaptureType | EXIF | 10 | 10 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:SceneType | EXIF | 11 | 11 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:SensingMethod | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:SensitivityType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:ShadingCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:Sharpness | EXIF | 10 | 10 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:ShutterSpeedValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:Software | EXIF | 11 | 11 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:SourceExposureTimesOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:SourceImageNumberOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:SpatialFrequencyResponse | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:SpectralSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:StandardOutputSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:StripByteCounts | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:StripOffsets | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:SubjectArea | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:SubjectDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:SubjectDistanceRange | EXIF | 10 | 10 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:SubjectLocation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:SubSecTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:SubSecTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:SubSecTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:Temperature | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:TransferFunction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:UserComment | EXIF | 11 | 0 | 11 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:WaterDepth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:WhiteBalance | EXIF | 10 | 10 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:WhitePoint | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:XResolution | EXIF | 11 | 0 | 11 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:YCbCrCoefficients | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:YCbCrPositioning | EXIF | 11 | 11 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:YCbCrSubSampling | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:YResolution | EXIF | 11 | 0 | 11 | 0 | 0 | 0 | 0 |
| NIKON | IPTC:Byline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | IPTC:Caption | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | IPTC:City | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | IPTC:CopyrightNotice | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | IPTC:CountryCode | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | IPTC:DateCreated | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | IPTC:Headline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | IPTC:Keywords | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | IPTC:ObjectName | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | XMP:XMP-dc:Creator | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | XMP:XMP-dc:Description | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | XMP:XMP-dc:Title | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | XMP:XMP-xmp:CreateDate | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | block:EXIF | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | block:ICC | ICC | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | block:IPTC | IPTC | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | block:JFIF | JFIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | block:XMP | XMP | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | DIMENSIONS:height | DIMENSIONS | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | DIMENSIONS:width | DIMENSIONS | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:Acceleration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:ApertureValue | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:Artist | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:BitsPerSample | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:BodySerialNumber | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:BrightnessValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:CameraElevationAngle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:CameraFirmware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:CameraOwnerName | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:CFAPattern | EXIF | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:ChromaticAberrationCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:ColorSpace | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:ComponentsConfiguration | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:CompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:CompressedBitsPerPixel | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:Compression | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:Contrast | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:Copyright | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:CustomRendered | EXIF | 2 | 2 | 0 | 0 | 1 | 0 | 0 |
| NIKON CORPORATION | EXIF:DateTime | EXIF | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:DateTimeDigitized | EXIF | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:DateTimeOriginal | EXIF | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:DevelopmentType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:DevelopmentTypeDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:DeviceSettingDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:DigitalZoomRatio | EXIF | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:DistortionCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:ExifIFDPointer | EXIF | 4 | 0 | 0 | 0 | 0 | 4 | 0 |
| NIKON CORPORATION | EXIF:ExifVersion | EXIF | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:ExposureBiasValue | EXIF | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:ExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:ExposureMode | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:ExposureProgram | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:ExposureTime | EXIF | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:FileSource | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:Flash | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:FlashEnergy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:FlashpixVersion | EXIF | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:FNumber | EXIF | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:FocalLength | EXIF | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:FocalLengthIn35mmFilm | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:FocalPlaneResolutionUnit | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:FocalPlaneXResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:FocalPlaneYResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:GainControl | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:Gamma | EXIF | 0 | 0 | 0 | 0 | 1 | 0 | 0 |
| NIKON CORPORATION | EXIF:GPSAltitude | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:GPSAltitudeRef | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:GPSAreaInformation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:GPSDateStamp | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:GPSDestBearing | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:GPSDestBearingRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:GPSDestDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:GPSDestDistanceRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:GPSDestLatitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:GPSDestLatitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:GPSDestLongitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:GPSDestLongitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:GPSDifferential | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:GPSDOP | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:GPSHPositioningError | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:GPSImgDirection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:GPSImgDirectionRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:GPSInfoIFDPointer | EXIF | 3 | 0 | 0 | 0 | 0 | 3 | 0 |
| NIKON CORPORATION | EXIF:GPSLatitude | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:GPSLatitudeRef | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:GPSLongitude | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:GPSLongitudeRef | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:GPSMapDatum | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:GPSMeasureMode | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:GPSProcessingMethod | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:GPSSatellites | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:GPSSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:GPSSpeedRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:GPSStatus | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:GPSTimeStamp | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:GPSTrack | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:GPSTrackRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:GPSVersionID | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:Humidity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:ImageDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:ImageEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:ImageEditor | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:ImageLength | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:ImageTitle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:ImageUniqueID | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:ImageWidth | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:InteroperabilityIFDPointer | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| NIKON CORPORATION | EXIF:InteroperabilityIndex | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| NIKON CORPORATION | EXIF:InteroperabilityVersion | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| NIKON CORPORATION | EXIF:ISOSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:ISOSpeedLatitudeyyy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:ISOSpeedLatitudezzz | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:ISOSpeedRatings | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:JPEGInterchangeFormat | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:JPEGInterchangeFormatLength | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:LearningOptOutIn | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:LensMake | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:LensModel | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:LensSerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:LensSpecification | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| NIKON CORPORATION | EXIF:LightSource | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:Make | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:MakerNote | EXIF | 3 | 0 | 0 | 0 | 0 | 3 | 0 |
| NIKON CORPORATION | EXIF:MaxApertureValue | EXIF | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:MetadataEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:MeteringMode | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:Model | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:NoiseReduction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:OECF | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:OffsetTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:OffsetTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:OffsetTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:Orientation | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:Photographer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:PhotometricInterpretation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:PixelXDimension | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:PixelYDimension | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:PlanarConfiguration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:Pressure | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:PrimaryChromaticities | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:RAWDevelopingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:RecommendedExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:ReferenceBlackWhite | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:RelatedImageFileFormat | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:RelatedImageLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:RelatedImageWidth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:RelatedSoundFile | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:ResolutionUnit | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:RowsPerStrip | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:SamplesPerPixel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:Saturation | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:SceneCaptureType | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:SceneType | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:SensingMethod | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:SensitivityType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:ShadingCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:Sharpness | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:ShutterSpeedValue | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:Software | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:SourceExposureTimesOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:SourceImageNumberOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:SpatialFrequencyResponse | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:SpectralSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:StandardOutputSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:StripByteCounts | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:StripOffsets | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:SubjectArea | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:SubjectDistance | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:SubjectDistanceRange | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:SubjectLocation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:SubSecTime | EXIF | 2 | 1 | 1 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:SubSecTimeDigitized | EXIF | 2 | 1 | 1 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:SubSecTimeOriginal | EXIF | 2 | 1 | 1 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:Temperature | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:TransferFunction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:UserComment | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:WaterDepth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:WhiteBalance | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:WhitePoint | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:XResolution | EXIF | 4 | 1 | 3 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:YCbCrCoefficients | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:YCbCrPositioning | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:YCbCrSubSampling | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:YResolution | EXIF | 4 | 1 | 3 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | IPTC:Byline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | IPTC:Caption | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | IPTC:City | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | IPTC:CopyrightNotice | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | IPTC:CountryCode | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | IPTC:DateCreated | IPTC | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | IPTC:Headline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | IPTC:Keywords | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | IPTC:ObjectName | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | XMP:XMP-dc:Creator | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | XMP:XMP-dc:Description | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | XMP:XMP-dc:Title | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | XMP:XMP-xmp:CreateDate | XMP | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | block:EXIF | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | block:ICC | ICC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | block:IPTC | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | block:JFIF | JFIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | block:XMP | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | DIMENSIONS:height | DIMENSIONS | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | DIMENSIONS:width | DIMENSIONS | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:Acceleration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:ApertureValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:Artist | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| OLYMPUS CORPORATION | EXIF:BitsPerSample | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:BodySerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:BrightnessValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:CameraElevationAngle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:CameraFirmware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:CameraOwnerName | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:CFAPattern | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:ChromaticAberrationCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:ColorSpace | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:ComponentsConfiguration | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:CompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:CompressedBitsPerPixel | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:Compression | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:Contrast | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:Copyright | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:CustomRendered | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:DateTime | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:DateTimeDigitized | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:DateTimeOriginal | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:DevelopmentType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:DevelopmentTypeDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:DeviceSettingDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:DigitalZoomRatio | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:DistortionCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:ExifIFDPointer | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| OLYMPUS CORPORATION | EXIF:ExifVersion | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:ExposureBiasValue | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:ExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:ExposureMode | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:ExposureProgram | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:ExposureTime | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:FileSource | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:Flash | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:FlashEnergy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:FlashpixVersion | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:FNumber | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:FocalLength | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:FocalLengthIn35mmFilm | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:FocalPlaneResolutionUnit | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:FocalPlaneXResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:FocalPlaneYResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:GainControl | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:Gamma | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:GPSAltitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:GPSAltitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:GPSAreaInformation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:GPSDateStamp | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:GPSDestBearing | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:GPSDestBearingRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:GPSDestDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:GPSDestDistanceRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:GPSDestLatitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:GPSDestLatitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:GPSDestLongitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:GPSDestLongitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:GPSDifferential | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:GPSDOP | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:GPSHPositioningError | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:GPSImgDirection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:GPSImgDirectionRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:GPSInfoIFDPointer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:GPSLatitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:GPSLatitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:GPSLongitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:GPSLongitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:GPSMapDatum | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:GPSMeasureMode | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:GPSProcessingMethod | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:GPSSatellites | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:GPSSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:GPSSpeedRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:GPSStatus | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:GPSTimeStamp | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:GPSTrack | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:GPSTrackRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:GPSVersionID | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:Humidity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:ImageDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:ImageEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:ImageEditor | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:ImageLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:ImageTitle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:ImageUniqueID | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:ImageWidth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:InteroperabilityIFDPointer | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| OLYMPUS CORPORATION | EXIF:InteroperabilityIndex | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| OLYMPUS CORPORATION | EXIF:InteroperabilityVersion | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| OLYMPUS CORPORATION | EXIF:ISOSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:ISOSpeedLatitudeyyy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:ISOSpeedLatitudezzz | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:ISOSpeedRatings | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:JPEGInterchangeFormat | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:JPEGInterchangeFormatLength | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:LearningOptOutIn | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:LensMake | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:LensModel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:LensSerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:LensSpecification | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:LightSource | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:Make | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:MakerNote | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:MaxApertureValue | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:MetadataEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:MeteringMode | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:Model | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:NoiseReduction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:OECF | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:OffsetTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:OffsetTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:OffsetTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:Orientation | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:Photographer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:PhotometricInterpretation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:PixelXDimension | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:PixelYDimension | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:PlanarConfiguration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:Pressure | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:PrimaryChromaticities | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:RAWDevelopingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:RecommendedExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:ReferenceBlackWhite | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:RelatedImageFileFormat | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:RelatedImageLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:RelatedImageWidth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:RelatedSoundFile | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:ResolutionUnit | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:RowsPerStrip | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:SamplesPerPixel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:Saturation | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:SceneCaptureType | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:SceneType | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:SensingMethod | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:SensitivityType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:ShadingCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:Sharpness | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:ShutterSpeedValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:Software | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:SourceExposureTimesOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:SourceImageNumberOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:SpatialFrequencyResponse | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:SpectralSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:StandardOutputSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:StripByteCounts | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:StripOffsets | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:SubjectArea | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:SubjectDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:SubjectDistanceRange | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:SubjectLocation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:SubSecTime | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:SubSecTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:SubSecTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:Temperature | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:TransferFunction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:UserComment | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:WaterDepth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:WhiteBalance | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:WhitePoint | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:XResolution | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:YCbCrCoefficients | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:YCbCrPositioning | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:YCbCrSubSampling | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:YResolution | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | IPTC:Byline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | IPTC:Caption | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | IPTC:City | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | IPTC:CopyrightNotice | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | IPTC:CountryCode | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | IPTC:DateCreated | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | IPTC:Headline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | IPTC:Keywords | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | IPTC:ObjectName | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | XMP:XMP-dc:Creator | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | XMP:XMP-dc:Description | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | XMP:XMP-dc:Title | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | XMP:XMP-xmp:CreateDate | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | block:EXIF | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | block:ICC | ICC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | block:IPTC | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | block:JFIF | JFIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | block:XMP | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | DIMENSIONS:height | DIMENSIONS | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | DIMENSIONS:width | DIMENSIONS | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:Acceleration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:ApertureValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:Artist | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:BitsPerSample | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:BodySerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:BrightnessValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:CameraElevationAngle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:CameraFirmware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:CameraOwnerName | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:CFAPattern | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:ChromaticAberrationCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:ColorSpace | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:ComponentsConfiguration | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:CompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:CompressedBitsPerPixel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:Compression | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:Contrast | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:Copyright | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:CustomRendered | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:DateTime | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:DateTimeDigitized | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:DateTimeOriginal | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:DevelopmentType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:DevelopmentTypeDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:DeviceSettingDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:DigitalZoomRatio | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:DistortionCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:ExifIFDPointer | EXIF | 2 | 0 | 0 | 0 | 0 | 2 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:ExifVersion | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:ExposureBiasValue | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:ExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:ExposureMode | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:ExposureProgram | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:ExposureTime | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:FileSource | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:Flash | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:FlashEnergy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:FlashpixVersion | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:FNumber | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:FocalLength | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:FocalLengthIn35mmFilm | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:FocalPlaneResolutionUnit | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:FocalPlaneXResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:FocalPlaneYResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:GainControl | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:Gamma | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:GPSAltitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:GPSAltitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:GPSAreaInformation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:GPSDateStamp | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:GPSDestBearing | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:GPSDestBearingRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:GPSDestDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:GPSDestDistanceRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:GPSDestLatitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:GPSDestLatitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:GPSDestLongitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:GPSDestLongitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:GPSDifferential | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:GPSDOP | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:GPSHPositioningError | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:GPSImgDirection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:GPSImgDirectionRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:GPSInfoIFDPointer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:GPSLatitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:GPSLatitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:GPSLongitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:GPSLongitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:GPSMapDatum | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:GPSMeasureMode | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:GPSProcessingMethod | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:GPSSatellites | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:GPSSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:GPSSpeedRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:GPSStatus | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:GPSTimeStamp | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:GPSTrack | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:GPSTrackRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:GPSVersionID | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:Humidity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:ImageDescription | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:ImageEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:ImageEditor | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:ImageLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:ImageTitle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:ImageUniqueID | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:ImageWidth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:InteroperabilityIFDPointer | EXIF | 2 | 0 | 0 | 0 | 0 | 2 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:InteroperabilityIndex | EXIF | 2 | 0 | 0 | 0 | 0 | 2 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:InteroperabilityVersion | EXIF | 2 | 0 | 0 | 0 | 0 | 2 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:ISOSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:ISOSpeedLatitudeyyy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:ISOSpeedLatitudezzz | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:ISOSpeedRatings | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:JPEGInterchangeFormat | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:JPEGInterchangeFormatLength | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:LearningOptOutIn | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:LensMake | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:LensModel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:LensSerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:LensSpecification | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:LightSource | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:Make | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:MakerNote | EXIF | 2 | 0 | 0 | 0 | 0 | 2 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:MaxApertureValue | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:MetadataEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:MeteringMode | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:Model | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:NoiseReduction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:OECF | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:OffsetTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:OffsetTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:OffsetTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:Orientation | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:Photographer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:PhotometricInterpretation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:PixelXDimension | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:PixelYDimension | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:PlanarConfiguration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:Pressure | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:PrimaryChromaticities | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:RAWDevelopingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:RecommendedExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:ReferenceBlackWhite | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:RelatedImageFileFormat | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:RelatedImageLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:RelatedImageWidth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:RelatedSoundFile | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:ResolutionUnit | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:RowsPerStrip | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:SamplesPerPixel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:Saturation | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:SceneCaptureType | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:SceneType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:SensingMethod | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:SensitivityType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:ShadingCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:Sharpness | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:ShutterSpeedValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:Software | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:SourceExposureTimesOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:SourceImageNumberOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:SpatialFrequencyResponse | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:SpectralSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:StandardOutputSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:StripByteCounts | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:StripOffsets | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:SubjectArea | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:SubjectDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:SubjectDistanceRange | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:SubjectLocation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:SubSecTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:SubSecTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:SubSecTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:Temperature | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:TransferFunction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:UserComment | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:WaterDepth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:WhiteBalance | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:WhitePoint | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:XResolution | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:YCbCrCoefficients | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:YCbCrPositioning | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:YCbCrSubSampling | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:YResolution | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | IPTC:Byline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | IPTC:Caption | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | IPTC:City | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | IPTC:CopyrightNotice | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | IPTC:CountryCode | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | IPTC:DateCreated | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | IPTC:Headline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | IPTC:Keywords | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | IPTC:ObjectName | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | XMP:XMP-dc:Creator | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | XMP:XMP-dc:Description | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | XMP:XMP-dc:Title | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | XMP:XMP-xmp:CreateDate | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | block:EXIF | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | block:ICC | ICC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | block:IPTC | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | block:JFIF | JFIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | block:XMP | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | DIMENSIONS:height | DIMENSIONS | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | DIMENSIONS:width | DIMENSIONS | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:Acceleration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:ApertureValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:Artist | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:BitsPerSample | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:BodySerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:BrightnessValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:CameraElevationAngle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:CameraFirmware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:CameraOwnerName | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:CFAPattern | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:ChromaticAberrationCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:ColorSpace | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:ComponentsConfiguration | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:CompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:CompressedBitsPerPixel | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:Compression | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:Contrast | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:Copyright | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:CustomRendered | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:DateTime | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:DateTimeDigitized | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:DateTimeOriginal | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:DevelopmentType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:DevelopmentTypeDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:DeviceSettingDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:DigitalZoomRatio | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:DistortionCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:ExifIFDPointer | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:ExifVersion | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:ExposureBiasValue | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:ExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:ExposureMode | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:ExposureProgram | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:ExposureTime | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:FileSource | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:Flash | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:FlashEnergy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:FlashpixVersion | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:FNumber | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:FocalLength | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:FocalLengthIn35mmFilm | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:FocalPlaneResolutionUnit | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:FocalPlaneXResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:FocalPlaneYResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:GainControl | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:Gamma | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:GPSAltitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:GPSAltitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:GPSAreaInformation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:GPSDateStamp | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:GPSDestBearing | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:GPSDestBearingRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:GPSDestDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:GPSDestDistanceRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:GPSDestLatitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:GPSDestLatitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:GPSDestLongitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:GPSDestLongitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:GPSDifferential | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:GPSDOP | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:GPSHPositioningError | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:GPSImgDirection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:GPSImgDirectionRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:GPSInfoIFDPointer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:GPSLatitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:GPSLatitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:GPSLongitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:GPSLongitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:GPSMapDatum | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:GPSMeasureMode | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:GPSProcessingMethod | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:GPSSatellites | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:GPSSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:GPSSpeedRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:GPSStatus | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:GPSTimeStamp | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:GPSTrack | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:GPSTrackRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:GPSVersionID | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:Humidity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:ImageDescription | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:ImageEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:ImageEditor | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:ImageLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:ImageTitle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:ImageUniqueID | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:ImageWidth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:InteroperabilityIFDPointer | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:InteroperabilityIndex | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:InteroperabilityVersion | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:ISOSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:ISOSpeedLatitudeyyy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:ISOSpeedLatitudezzz | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:ISOSpeedRatings | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:JPEGInterchangeFormat | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:JPEGInterchangeFormatLength | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:LearningOptOutIn | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:LensMake | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:LensModel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:LensSerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:LensSpecification | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:LightSource | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:Make | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:MakerNote | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:MaxApertureValue | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:MetadataEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:MeteringMode | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:Model | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:NoiseReduction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:OECF | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:OffsetTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:OffsetTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:OffsetTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:Orientation | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:Photographer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:PhotometricInterpretation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:PixelXDimension | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:PixelYDimension | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:PlanarConfiguration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:Pressure | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:PrimaryChromaticities | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:RAWDevelopingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:RecommendedExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:ReferenceBlackWhite | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:RelatedImageFileFormat | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:RelatedImageLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:RelatedImageWidth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:RelatedSoundFile | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:ResolutionUnit | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:RowsPerStrip | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:SamplesPerPixel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:Saturation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:SceneCaptureType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:SceneType | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:SensingMethod | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:SensitivityType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:ShadingCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:Sharpness | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:ShutterSpeedValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:Software | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:SourceExposureTimesOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:SourceImageNumberOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:SpatialFrequencyResponse | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:SpectralSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:StandardOutputSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:StripByteCounts | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:StripOffsets | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:SubjectArea | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:SubjectDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:SubjectDistanceRange | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:SubjectLocation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:SubSecTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:SubSecTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:SubSecTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:Temperature | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:TransferFunction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:UserComment | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:WaterDepth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:WhiteBalance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:WhitePoint | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:XResolution | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:YCbCrCoefficients | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:YCbCrPositioning | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:YCbCrSubSampling | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | EXIF:YResolution | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | IPTC:Byline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | IPTC:Caption | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | IPTC:City | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | IPTC:CopyrightNotice | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | IPTC:CountryCode | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | IPTC:DateCreated | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | IPTC:Headline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | IPTC:Keywords | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | IPTC:ObjectName | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | XMP:XMP-dc:Creator | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | XMP:XMP-dc:Description | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | XMP:XMP-dc:Title | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS OPTICAL CO.,LTD | XMP:XMP-xmp:CreateDate | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | block:EXIF | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | block:ICC | ICC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | block:IPTC | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | block:JFIF | JFIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | block:XMP | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | DIMENSIONS:height | DIMENSIONS | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | DIMENSIONS:width | DIMENSIONS | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:Acceleration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:ApertureValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:Artist | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:BitsPerSample | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:BodySerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:BrightnessValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:CameraElevationAngle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:CameraFirmware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:CameraOwnerName | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:CFAPattern | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:ChromaticAberrationCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:ColorSpace | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:ComponentsConfiguration | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:CompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:CompressedBitsPerPixel | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:Compression | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:Contrast | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:Copyright | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:CustomRendered | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:DateTime | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:DateTimeDigitized | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:DateTimeOriginal | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:DevelopmentType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:DevelopmentTypeDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:DeviceSettingDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:DigitalZoomRatio | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:DistortionCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:ExifIFDPointer | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| Panasonic | EXIF:ExifVersion | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:ExposureBiasValue | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:ExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:ExposureMode | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:ExposureProgram | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:ExposureTime | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:FileSource | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:Flash | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:FlashEnergy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:FlashpixVersion | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:FNumber | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:FocalLength | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:FocalLengthIn35mmFilm | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:FocalPlaneResolutionUnit | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:FocalPlaneXResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:FocalPlaneYResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:GainControl | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:Gamma | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:GPSAltitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:GPSAltitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:GPSAreaInformation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:GPSDateStamp | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:GPSDestBearing | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:GPSDestBearingRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:GPSDestDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:GPSDestDistanceRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:GPSDestLatitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:GPSDestLatitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:GPSDestLongitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:GPSDestLongitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:GPSDifferential | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:GPSDOP | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:GPSHPositioningError | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:GPSImgDirection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:GPSImgDirectionRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:GPSInfoIFDPointer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:GPSLatitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:GPSLatitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:GPSLongitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:GPSLongitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:GPSMapDatum | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:GPSMeasureMode | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:GPSProcessingMethod | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:GPSSatellites | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:GPSSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:GPSSpeedRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:GPSStatus | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:GPSTimeStamp | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:GPSTrack | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:GPSTrackRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:GPSVersionID | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:Humidity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:ImageDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:ImageEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:ImageEditor | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:ImageLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:ImageTitle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:ImageUniqueID | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:ImageWidth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:InteroperabilityIFDPointer | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| Panasonic | EXIF:InteroperabilityIndex | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| Panasonic | EXIF:InteroperabilityVersion | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| Panasonic | EXIF:ISOSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:ISOSpeedLatitudeyyy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:ISOSpeedLatitudezzz | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:ISOSpeedRatings | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:JPEGInterchangeFormat | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:JPEGInterchangeFormatLength | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:LearningOptOutIn | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:LensMake | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:LensModel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:LensSerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:LensSpecification | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:LightSource | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:Make | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:MakerNote | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| Panasonic | EXIF:MaxApertureValue | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:MetadataEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:MeteringMode | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:Model | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:NoiseReduction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:OECF | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:OffsetTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:OffsetTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:OffsetTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:Orientation | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:Photographer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:PhotometricInterpretation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:PixelXDimension | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:PixelYDimension | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:PlanarConfiguration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:Pressure | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:PrimaryChromaticities | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:RAWDevelopingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:RecommendedExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:ReferenceBlackWhite | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:RelatedImageFileFormat | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:RelatedImageLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:RelatedImageWidth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:RelatedSoundFile | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:ResolutionUnit | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:RowsPerStrip | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:SamplesPerPixel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:Saturation | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:SceneCaptureType | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:SceneType | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:SensingMethod | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:SensitivityType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:ShadingCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:Sharpness | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:ShutterSpeedValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:Software | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:SourceExposureTimesOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:SourceImageNumberOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:SpatialFrequencyResponse | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:SpectralSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:StandardOutputSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:StripByteCounts | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:StripOffsets | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:SubjectArea | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:SubjectDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:SubjectDistanceRange | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:SubjectLocation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:SubSecTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:SubSecTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:SubSecTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:Temperature | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:TransferFunction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:UserComment | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:WaterDepth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:WhiteBalance | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:WhitePoint | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:XResolution | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:YCbCrCoefficients | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:YCbCrPositioning | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:YCbCrSubSampling | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:YResolution | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Panasonic | IPTC:Byline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | IPTC:Caption | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | IPTC:City | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | IPTC:CopyrightNotice | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | IPTC:CountryCode | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | IPTC:DateCreated | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | IPTC:Headline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | IPTC:Keywords | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | IPTC:ObjectName | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | XMP:XMP-dc:Creator | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | XMP:XMP-dc:Description | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | XMP:XMP-dc:Title | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | XMP:XMP-xmp:CreateDate | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | block:EXIF | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | block:ICC | ICC | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | block:IPTC | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | block:JFIF | JFIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | block:XMP | XMP | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | DIMENSIONS:height | DIMENSIONS | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | DIMENSIONS:width | DIMENSIONS | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:Acceleration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:ApertureValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:Artist | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:BitsPerSample | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:BodySerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:BrightnessValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:CameraElevationAngle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:CameraFirmware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:CameraOwnerName | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:CFAPattern | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:ChromaticAberrationCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:ColorSpace | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:ComponentsConfiguration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:CompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:CompressedBitsPerPixel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:Compression | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:Contrast | EXIF | 0 | 0 | 0 | 0 | 1 | 0 | 0 |
| PENTAX Corporation | EXIF:Copyright | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:CustomRendered | EXIF | 0 | 0 | 0 | 0 | 1 | 0 | 0 |
| PENTAX Corporation | EXIF:DateTime | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:DateTimeDigitized | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:DateTimeOriginal | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:DevelopmentType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:DevelopmentTypeDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:DeviceSettingDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:DigitalZoomRatio | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:DistortionCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:ExifIFDPointer | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| PENTAX Corporation | EXIF:ExifVersion | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:ExposureBiasValue | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:ExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:ExposureMode | EXIF | 0 | 0 | 0 | 0 | 1 | 0 | 0 |
| PENTAX Corporation | EXIF:ExposureProgram | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:ExposureTime | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:FileSource | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:Flash | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:FlashEnergy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:FlashpixVersion | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:FNumber | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:FocalLength | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:FocalLengthIn35mmFilm | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:FocalPlaneResolutionUnit | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:FocalPlaneXResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:FocalPlaneYResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:GainControl | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:Gamma | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:GPSAltitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:GPSAltitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:GPSAreaInformation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:GPSDateStamp | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:GPSDestBearing | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:GPSDestBearingRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:GPSDestDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:GPSDestDistanceRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:GPSDestLatitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:GPSDestLatitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:GPSDestLongitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:GPSDestLongitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:GPSDifferential | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:GPSDOP | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:GPSHPositioningError | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:GPSImgDirection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:GPSImgDirectionRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:GPSInfoIFDPointer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:GPSLatitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:GPSLatitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:GPSLongitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:GPSLongitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:GPSMapDatum | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:GPSMeasureMode | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:GPSProcessingMethod | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:GPSSatellites | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:GPSSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:GPSSpeedRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:GPSStatus | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:GPSTimeStamp | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:GPSTrack | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:GPSTrackRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:GPSVersionID | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:Humidity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:ImageDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:ImageEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:ImageEditor | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:ImageLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:ImageTitle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:ImageUniqueID | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:ImageWidth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:InteroperabilityIFDPointer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:InteroperabilityIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:InteroperabilityVersion | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:ISOSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:ISOSpeedLatitudeyyy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:ISOSpeedLatitudezzz | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:ISOSpeedRatings | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:JPEGInterchangeFormat | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:JPEGInterchangeFormatLength | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:LearningOptOutIn | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:LensMake | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:LensModel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:LensSerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:LensSpecification | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:LightSource | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:Make | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:MakerNote | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:MaxApertureValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:MetadataEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:MeteringMode | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:Model | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:NoiseReduction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:OECF | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:OffsetTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:OffsetTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:OffsetTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:Orientation | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:Photographer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:PhotometricInterpretation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:PixelXDimension | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:PixelYDimension | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:PlanarConfiguration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:Pressure | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:PrimaryChromaticities | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:RAWDevelopingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:RecommendedExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:ReferenceBlackWhite | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:RelatedImageFileFormat | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:RelatedImageLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:RelatedImageWidth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:RelatedSoundFile | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:ResolutionUnit | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:RowsPerStrip | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:SamplesPerPixel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:Saturation | EXIF | 0 | 0 | 0 | 0 | 1 | 0 | 0 |
| PENTAX Corporation | EXIF:SceneCaptureType | EXIF | 0 | 0 | 0 | 0 | 1 | 0 | 0 |
| PENTAX Corporation | EXIF:SceneType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:SensingMethod | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:SensitivityType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:ShadingCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:Sharpness | EXIF | 0 | 0 | 0 | 0 | 1 | 0 | 0 |
| PENTAX Corporation | EXIF:ShutterSpeedValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:Software | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:SourceExposureTimesOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:SourceImageNumberOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:SpatialFrequencyResponse | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:SpectralSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:StandardOutputSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:StripByteCounts | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:StripOffsets | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:SubjectArea | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:SubjectDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:SubjectDistanceRange | EXIF | 0 | 0 | 0 | 0 | 1 | 0 | 0 |
| PENTAX Corporation | EXIF:SubjectLocation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:SubSecTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:SubSecTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:SubSecTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:Temperature | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:TransferFunction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:UserComment | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:WaterDepth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:WhiteBalance | EXIF | 0 | 0 | 0 | 0 | 1 | 0 | 0 |
| PENTAX Corporation | EXIF:WhitePoint | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:XResolution | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:YCbCrCoefficients | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:YCbCrPositioning | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:YCbCrSubSampling | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:YResolution | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | IPTC:Byline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | IPTC:Caption | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | IPTC:City | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | IPTC:CopyrightNotice | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | IPTC:CountryCode | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | IPTC:DateCreated | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | IPTC:Headline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | IPTC:Keywords | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | IPTC:ObjectName | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | XMP:XMP-dc:Creator | XMP | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | XMP:XMP-dc:Description | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | XMP:XMP-dc:Title | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | XMP:XMP-xmp:CreateDate | XMP | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | block:EXIF | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | block:ICC | ICC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | block:IPTC | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | block:JFIF | JFIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | block:XMP | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | DIMENSIONS:height | DIMENSIONS | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | DIMENSIONS:width | DIMENSIONS | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:Acceleration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:ApertureValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:Artist | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:BitsPerSample | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:BodySerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:BrightnessValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:CameraElevationAngle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:CameraFirmware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:CameraOwnerName | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:CFAPattern | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:ChromaticAberrationCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:ColorSpace | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:ComponentsConfiguration | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:CompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:CompressedBitsPerPixel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:Compression | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:Contrast | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:Copyright | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:CustomRendered | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:DateTime | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:DateTimeDigitized | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:DateTimeOriginal | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:DevelopmentType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:DevelopmentTypeDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:DeviceSettingDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:DigitalZoomRatio | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:DistortionCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:ExifIFDPointer | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| Polyphony Digital Inc. | EXIF:ExifVersion | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:ExposureBiasValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:ExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:ExposureMode | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:ExposureProgram | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:ExposureTime | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:FileSource | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:Flash | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:FlashEnergy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:FlashpixVersion | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:FNumber | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:FocalLength | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:FocalLengthIn35mmFilm | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:FocalPlaneResolutionUnit | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:FocalPlaneXResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:FocalPlaneYResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:GainControl | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:Gamma | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:GPSAltitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:GPSAltitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:GPSAreaInformation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:GPSDateStamp | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:GPSDestBearing | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:GPSDestBearingRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:GPSDestDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:GPSDestDistanceRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:GPSDestLatitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:GPSDestLatitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:GPSDestLongitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:GPSDestLongitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:GPSDifferential | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:GPSDOP | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:GPSHPositioningError | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:GPSImgDirection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:GPSImgDirectionRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:GPSInfoIFDPointer | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| Polyphony Digital Inc. | EXIF:GPSLatitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:GPSLatitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:GPSLongitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:GPSLongitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:GPSMapDatum | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:GPSMeasureMode | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:GPSProcessingMethod | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:GPSSatellites | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:GPSSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:GPSSpeedRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:GPSStatus | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:GPSTimeStamp | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:GPSTrack | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:GPSTrackRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:GPSVersionID | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:Humidity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:ImageDescription | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:ImageEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:ImageEditor | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:ImageLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:ImageTitle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:ImageUniqueID | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:ImageWidth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:InteroperabilityIFDPointer | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| Polyphony Digital Inc. | EXIF:InteroperabilityIndex | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| Polyphony Digital Inc. | EXIF:InteroperabilityVersion | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| Polyphony Digital Inc. | EXIF:ISOSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:ISOSpeedLatitudeyyy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:ISOSpeedLatitudezzz | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:ISOSpeedRatings | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:JPEGInterchangeFormat | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:JPEGInterchangeFormatLength | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:LearningOptOutIn | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:LensMake | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:LensModel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:LensSerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:LensSpecification | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:LightSource | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:Make | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:MakerNote | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| Polyphony Digital Inc. | EXIF:MaxApertureValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:MetadataEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:MeteringMode | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:Model | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:NoiseReduction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:OECF | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:OffsetTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:OffsetTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:OffsetTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:Orientation | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:Photographer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:PhotometricInterpretation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:PixelXDimension | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:PixelYDimension | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:PlanarConfiguration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:Pressure | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:PrimaryChromaticities | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:RAWDevelopingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:RecommendedExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:ReferenceBlackWhite | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:RelatedImageFileFormat | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:RelatedImageLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:RelatedImageWidth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:RelatedSoundFile | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:ResolutionUnit | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:RowsPerStrip | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:SamplesPerPixel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:Saturation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:SceneCaptureType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:SceneType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:SensingMethod | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:SensitivityType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:ShadingCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:Sharpness | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:ShutterSpeedValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:Software | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:SourceExposureTimesOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:SourceImageNumberOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:SpatialFrequencyResponse | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:SpectralSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:StandardOutputSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:StripByteCounts | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:StripOffsets | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:SubjectArea | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:SubjectDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:SubjectDistanceRange | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:SubjectLocation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:SubSecTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:SubSecTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:SubSecTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:Temperature | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:TransferFunction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:UserComment | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:WaterDepth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:WhiteBalance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:WhitePoint | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:XResolution | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:YCbCrCoefficients | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:YCbCrPositioning | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:YCbCrSubSampling | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | EXIF:YResolution | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | IPTC:Byline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | IPTC:Caption | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | IPTC:City | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | IPTC:CopyrightNotice | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | IPTC:CountryCode | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | IPTC:DateCreated | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | IPTC:Headline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | IPTC:Keywords | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | IPTC:ObjectName | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | XMP:XMP-dc:Creator | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | XMP:XMP-dc:Description | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | XMP:XMP-dc:Title | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Polyphony Digital Inc. | XMP:XMP-xmp:CreateDate | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | block:EXIF | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| RICOH | block:ICC | ICC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | block:IPTC | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | block:JFIF | JFIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | block:XMP | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | DIMENSIONS:height | DIMENSIONS | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| RICOH | DIMENSIONS:width | DIMENSIONS | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:Acceleration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:ApertureValue | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:Artist | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:BitsPerSample | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:BodySerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:BrightnessValue | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:CameraElevationAngle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:CameraFirmware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:CameraOwnerName | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:CFAPattern | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:ChromaticAberrationCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:ColorSpace | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:ComponentsConfiguration | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:CompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:CompressedBitsPerPixel | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:Compression | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:Contrast | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:Copyright | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:CustomRendered | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:DateTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:DateTimeDigitized | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:DateTimeOriginal | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:DevelopmentType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:DevelopmentTypeDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:DeviceSettingDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:DigitalZoomRatio | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:DistortionCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:ExifIFDPointer | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| RICOH | EXIF:ExifVersion | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:ExposureBiasValue | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:ExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:ExposureMode | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:ExposureProgram | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:ExposureTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:FileSource | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:Flash | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:FlashEnergy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:FlashpixVersion | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:FNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:FocalLength | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:FocalLengthIn35mmFilm | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:FocalPlaneResolutionUnit | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:FocalPlaneXResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:FocalPlaneYResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:GainControl | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:Gamma | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:GPSAltitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:GPSAltitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:GPSAreaInformation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:GPSDateStamp | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:GPSDestBearing | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:GPSDestBearingRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:GPSDestDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:GPSDestDistanceRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:GPSDestLatitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:GPSDestLatitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:GPSDestLongitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:GPSDestLongitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:GPSDifferential | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:GPSDOP | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:GPSHPositioningError | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:GPSImgDirection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:GPSImgDirectionRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:GPSInfoIFDPointer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:GPSLatitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:GPSLatitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:GPSLongitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:GPSLongitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:GPSMapDatum | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:GPSMeasureMode | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:GPSProcessingMethod | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:GPSSatellites | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:GPSSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:GPSSpeedRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:GPSStatus | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:GPSTimeStamp | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:GPSTrack | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:GPSTrackRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:GPSVersionID | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:Humidity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:ImageDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:ImageEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:ImageEditor | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:ImageLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:ImageTitle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:ImageUniqueID | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:ImageWidth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:InteroperabilityIFDPointer | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| RICOH | EXIF:InteroperabilityIndex | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| RICOH | EXIF:InteroperabilityVersion | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| RICOH | EXIF:ISOSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:ISOSpeedLatitudeyyy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:ISOSpeedLatitudezzz | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:ISOSpeedRatings | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:JPEGInterchangeFormat | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:JPEGInterchangeFormatLength | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:LearningOptOutIn | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:LensMake | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:LensModel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:LensSerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:LensSpecification | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:LightSource | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:Make | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:MakerNote | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| RICOH | EXIF:MaxApertureValue | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:MetadataEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:MeteringMode | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:Model | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:NoiseReduction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:OECF | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:OffsetTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:OffsetTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:OffsetTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:Orientation | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:Photographer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:PhotometricInterpretation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:PixelXDimension | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:PixelYDimension | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:PlanarConfiguration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:Pressure | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:PrimaryChromaticities | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:RAWDevelopingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:RecommendedExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:ReferenceBlackWhite | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:RelatedImageFileFormat | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:RelatedImageLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:RelatedImageWidth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:RelatedSoundFile | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:ResolutionUnit | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:RowsPerStrip | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:SamplesPerPixel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:Saturation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:SceneCaptureType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:SceneType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:SensingMethod | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:SensitivityType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:ShadingCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:Sharpness | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:ShutterSpeedValue | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:Software | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:SourceExposureTimesOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:SourceImageNumberOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:SpatialFrequencyResponse | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:SpectralSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:StandardOutputSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:StripByteCounts | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:StripOffsets | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:SubjectArea | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:SubjectDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:SubjectDistanceRange | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:SubjectLocation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:SubSecTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:SubSecTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:SubSecTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:Temperature | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:TransferFunction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:UserComment | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| RICOH | EXIF:WaterDepth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:WhiteBalance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:WhitePoint | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:XResolution | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:YCbCrCoefficients | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:YCbCrPositioning | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:YCbCrSubSampling | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | EXIF:YResolution | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| RICOH | IPTC:Byline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | IPTC:Caption | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | IPTC:City | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | IPTC:CopyrightNotice | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | IPTC:CountryCode | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | IPTC:DateCreated | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | IPTC:Headline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | IPTC:Keywords | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | IPTC:ObjectName | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | XMP:XMP-dc:Creator | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | XMP:XMP-dc:Description | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | XMP:XMP-dc:Title | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RICOH | XMP:XMP-xmp:CreateDate | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | block:EXIF | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| samsung | block:ICC | ICC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | block:IPTC | IPTC | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| samsung | block:JFIF | JFIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| samsung | block:XMP | XMP | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| samsung | DIMENSIONS:height | DIMENSIONS | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| samsung | DIMENSIONS:width | DIMENSIONS | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:Acceleration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:ApertureValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:Artist | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:BitsPerSample | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:BodySerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:BrightnessValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:CameraElevationAngle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:CameraFirmware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:CameraOwnerName | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:CFAPattern | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:ChromaticAberrationCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:ColorSpace | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:ComponentsConfiguration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:CompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:CompressedBitsPerPixel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:Compression | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:Contrast | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:Copyright | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:CustomRendered | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:DateTime | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| samsung | EXIF:DateTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:DateTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:DevelopmentType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:DevelopmentTypeDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:DeviceSettingDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:DigitalZoomRatio | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:DistortionCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:ExifIFDPointer | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| samsung | EXIF:ExifVersion | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:ExposureBiasValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:ExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:ExposureMode | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:ExposureProgram | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:ExposureTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:FileSource | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:Flash | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:FlashEnergy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:FlashpixVersion | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:FNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:FocalLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:FocalLengthIn35mmFilm | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:FocalPlaneResolutionUnit | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:FocalPlaneXResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:FocalPlaneYResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:GainControl | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:Gamma | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:GPSAltitude | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| samsung | EXIF:GPSAltitudeRef | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:GPSAreaInformation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:GPSDateStamp | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:GPSDestBearing | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:GPSDestBearingRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:GPSDestDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:GPSDestDistanceRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:GPSDestLatitude | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:GPSDestLatitudeRef | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:GPSDestLongitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:GPSDestLongitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:GPSDifferential | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:GPSDOP | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| samsung | EXIF:GPSHPositioningError | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:GPSImgDirection | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| samsung | EXIF:GPSImgDirectionRef | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:GPSInfoIFDPointer | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| samsung | EXIF:GPSLatitude | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:GPSLatitudeRef | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:GPSLongitude | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:GPSLongitudeRef | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:GPSMapDatum | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:GPSMeasureMode | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:GPSProcessingMethod | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:GPSSatellites | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:GPSSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:GPSSpeedRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:GPSStatus | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:GPSTimeStamp | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:GPSTrack | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:GPSTrackRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:GPSVersionID | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:Humidity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:ImageDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:ImageEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:ImageEditor | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:ImageLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:ImageTitle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:ImageUniqueID | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:ImageWidth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:InteroperabilityIFDPointer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:InteroperabilityIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:InteroperabilityVersion | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:ISOSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:ISOSpeedLatitudeyyy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:ISOSpeedLatitudezzz | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:ISOSpeedRatings | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:JPEGInterchangeFormat | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:JPEGInterchangeFormatLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:LearningOptOutIn | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:LensMake | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:LensModel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:LensSerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:LensSpecification | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:LightSource | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:Make | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:MakerNote | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:MaxApertureValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:MetadataEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:MeteringMode | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:Model | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:NoiseReduction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:OECF | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:OffsetTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:OffsetTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:OffsetTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:Orientation | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:Photographer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:PhotometricInterpretation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:PixelXDimension | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:PixelYDimension | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:PlanarConfiguration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:Pressure | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:PrimaryChromaticities | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:RAWDevelopingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:RecommendedExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:ReferenceBlackWhite | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:RelatedImageFileFormat | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:RelatedImageLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:RelatedImageWidth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:RelatedSoundFile | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:ResolutionUnit | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:RowsPerStrip | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:SamplesPerPixel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:Saturation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:SceneCaptureType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:SceneType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:SensingMethod | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:SensitivityType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:ShadingCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:Sharpness | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:ShutterSpeedValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:Software | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:SourceExposureTimesOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:SourceImageNumberOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:SpatialFrequencyResponse | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:SpectralSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:StandardOutputSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:StripByteCounts | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:StripOffsets | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:SubjectArea | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:SubjectDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:SubjectDistanceRange | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:SubjectLocation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:SubSecTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:SubSecTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:SubSecTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:Temperature | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:TransferFunction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:UserComment | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:WaterDepth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:WhiteBalance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:WhitePoint | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:XResolution | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| samsung | EXIF:YCbCrCoefficients | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:YCbCrPositioning | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:YCbCrSubSampling | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:YResolution | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| samsung | IPTC:Byline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | IPTC:Caption | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | IPTC:City | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | IPTC:CopyrightNotice | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | IPTC:CountryCode | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | IPTC:DateCreated | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | IPTC:Headline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | IPTC:Keywords | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | IPTC:ObjectName | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | XMP:XMP-dc:Creator | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | XMP:XMP-dc:Description | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | XMP:XMP-dc:Title | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | XMP:XMP-xmp:CreateDate | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | block:EXIF | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | block:ICC | ICC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | block:IPTC | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | block:JFIF | JFIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | block:XMP | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | DIMENSIONS:height | DIMENSIONS | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | DIMENSIONS:width | DIMENSIONS | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:Acceleration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:ApertureValue | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:Artist | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:BitsPerSample | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:BodySerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:BrightnessValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:CameraElevationAngle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:CameraFirmware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:CameraOwnerName | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:CFAPattern | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:ChromaticAberrationCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:ColorSpace | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:ComponentsConfiguration | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:CompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:CompressedBitsPerPixel | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:Compression | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:Contrast | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:Copyright | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:CustomRendered | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:DateTime | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:DateTimeDigitized | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:DateTimeOriginal | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:DevelopmentType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:DevelopmentTypeDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:DeviceSettingDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:DigitalZoomRatio | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:DistortionCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:ExifIFDPointer | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| Samsung Techwin | EXIF:ExifVersion | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:ExposureBiasValue | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:ExposureIndex | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:ExposureMode | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:ExposureProgram | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:ExposureTime | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:FileSource | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:Flash | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:FlashEnergy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:FlashpixVersion | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:FNumber | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:FocalLength | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:FocalLengthIn35mmFilm | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:FocalPlaneResolutionUnit | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:FocalPlaneXResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:FocalPlaneYResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:GainControl | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:Gamma | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:GPSAltitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:GPSAltitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:GPSAreaInformation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:GPSDateStamp | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:GPSDestBearing | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:GPSDestBearingRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:GPSDestDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:GPSDestDistanceRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:GPSDestLatitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:GPSDestLatitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:GPSDestLongitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:GPSDestLongitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:GPSDifferential | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:GPSDOP | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:GPSHPositioningError | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:GPSImgDirection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:GPSImgDirectionRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:GPSInfoIFDPointer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:GPSLatitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:GPSLatitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:GPSLongitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:GPSLongitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:GPSMapDatum | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:GPSMeasureMode | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:GPSProcessingMethod | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:GPSSatellites | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:GPSSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:GPSSpeedRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:GPSStatus | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:GPSTimeStamp | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:GPSTrack | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:GPSTrackRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:GPSVersionID | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:Humidity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:ImageDescription | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:ImageEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:ImageEditor | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:ImageLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:ImageTitle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:ImageUniqueID | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:ImageWidth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:InteroperabilityIFDPointer | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| Samsung Techwin | EXIF:InteroperabilityIndex | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| Samsung Techwin | EXIF:InteroperabilityVersion | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| Samsung Techwin | EXIF:ISOSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:ISOSpeedLatitudeyyy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:ISOSpeedLatitudezzz | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:ISOSpeedRatings | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:JPEGInterchangeFormat | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:JPEGInterchangeFormatLength | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:LearningOptOutIn | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:LensMake | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:LensModel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:LensSerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:LensSpecification | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:LightSource | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:Make | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:MakerNote | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| Samsung Techwin | EXIF:MaxApertureValue | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:MetadataEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:MeteringMode | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:Model | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:NoiseReduction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:OECF | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:OffsetTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:OffsetTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:OffsetTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:Orientation | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:Photographer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:PhotometricInterpretation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:PixelXDimension | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:PixelYDimension | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:PlanarConfiguration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:Pressure | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:PrimaryChromaticities | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:RAWDevelopingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:RecommendedExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:ReferenceBlackWhite | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:RelatedImageFileFormat | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:RelatedImageLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:RelatedImageWidth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:RelatedSoundFile | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:ResolutionUnit | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:RowsPerStrip | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:SamplesPerPixel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:Saturation | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:SceneCaptureType | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:SceneType | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:SensingMethod | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:SensitivityType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:ShadingCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:Sharpness | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:ShutterSpeedValue | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:Software | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:SourceExposureTimesOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:SourceImageNumberOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:SpatialFrequencyResponse | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:SpectralSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:StandardOutputSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:StripByteCounts | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:StripOffsets | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:SubjectArea | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:SubjectDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:SubjectDistanceRange | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:SubjectLocation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:SubSecTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:SubSecTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:SubSecTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:Temperature | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:TransferFunction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:UserComment | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:WaterDepth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:WhiteBalance | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:WhitePoint | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:XResolution | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:YCbCrCoefficients | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:YCbCrPositioning | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:YCbCrSubSampling | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:YResolution | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Samsung Techwin | IPTC:Byline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | IPTC:Caption | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | IPTC:City | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | IPTC:CopyrightNotice | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | IPTC:CountryCode | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | IPTC:DateCreated | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | IPTC:Headline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | IPTC:Keywords | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | IPTC:ObjectName | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | XMP:XMP-dc:Creator | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | XMP:XMP-dc:Description | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | XMP:XMP-dc:Title | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | XMP:XMP-xmp:CreateDate | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | block:EXIF | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | block:ICC | ICC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | block:IPTC | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | block:JFIF | JFIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | block:XMP | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | DIMENSIONS:height | DIMENSIONS | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | DIMENSIONS:width | DIMENSIONS | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:Acceleration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:ApertureValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:Artist | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:BitsPerSample | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:BodySerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:BrightnessValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:CameraElevationAngle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:CameraFirmware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:CameraOwnerName | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:CFAPattern | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:ChromaticAberrationCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:ColorSpace | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:ComponentsConfiguration | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:CompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:CompressedBitsPerPixel | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:Compression | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:Contrast | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:Copyright | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:CustomRendered | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:DateTime | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:DateTimeDigitized | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:DateTimeOriginal | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:DevelopmentType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:DevelopmentTypeDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:DeviceSettingDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:DigitalZoomRatio | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:DistortionCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:ExifIFDPointer | EXIF | 2 | 0 | 0 | 0 | 0 | 2 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:ExifVersion | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:ExposureBiasValue | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:ExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:ExposureMode | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:ExposureProgram | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:ExposureTime | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:FileSource | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:Flash | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:FlashEnergy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:FlashpixVersion | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:FNumber | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:FocalLength | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:FocalLengthIn35mmFilm | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:FocalPlaneResolutionUnit | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:FocalPlaneXResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:FocalPlaneYResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:GainControl | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:Gamma | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:GPSAltitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:GPSAltitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:GPSAreaInformation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:GPSDateStamp | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:GPSDestBearing | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:GPSDestBearingRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:GPSDestDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:GPSDestDistanceRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:GPSDestLatitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:GPSDestLatitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:GPSDestLongitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:GPSDestLongitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:GPSDifferential | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:GPSDOP | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:GPSHPositioningError | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:GPSImgDirection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:GPSImgDirectionRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:GPSInfoIFDPointer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:GPSLatitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:GPSLatitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:GPSLongitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:GPSLongitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:GPSMapDatum | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:GPSMeasureMode | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:GPSProcessingMethod | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:GPSSatellites | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:GPSSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:GPSSpeedRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:GPSStatus | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:GPSTimeStamp | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:GPSTrack | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:GPSTrackRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:GPSVersionID | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:Humidity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:ImageDescription | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:ImageEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:ImageEditor | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:ImageLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:ImageTitle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:ImageUniqueID | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:ImageWidth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:InteroperabilityIFDPointer | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:InteroperabilityIndex | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:InteroperabilityVersion | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:ISOSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:ISOSpeedLatitudeyyy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:ISOSpeedLatitudezzz | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:ISOSpeedRatings | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:JPEGInterchangeFormat | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:JPEGInterchangeFormatLength | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:LearningOptOutIn | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:LensMake | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:LensModel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:LensSerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:LensSpecification | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:LightSource | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:Make | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:MakerNote | EXIF | 2 | 0 | 0 | 0 | 0 | 2 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:MaxApertureValue | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:MetadataEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:MeteringMode | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:Model | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:NoiseReduction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:OECF | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:OffsetTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:OffsetTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:OffsetTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:Orientation | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:Photographer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:PhotometricInterpretation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:PixelXDimension | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:PixelYDimension | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:PlanarConfiguration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:Pressure | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:PrimaryChromaticities | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:RAWDevelopingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:RecommendedExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:ReferenceBlackWhite | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:RelatedImageFileFormat | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:RelatedImageLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:RelatedImageWidth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:RelatedSoundFile | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:ResolutionUnit | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:RowsPerStrip | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:SamplesPerPixel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:Saturation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:SceneCaptureType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:SceneType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:SensingMethod | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:SensitivityType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:ShadingCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:Sharpness | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:ShutterSpeedValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:Software | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:SourceExposureTimesOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:SourceImageNumberOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:SpatialFrequencyResponse | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:SpectralSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:StandardOutputSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:StripByteCounts | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:StripOffsets | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:SubjectArea | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:SubjectDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:SubjectDistanceRange | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:SubjectLocation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:SubSecTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:SubSecTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:SubSecTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:Temperature | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:TransferFunction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:UserComment | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:WaterDepth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:WhiteBalance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:WhitePoint | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:XResolution | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:YCbCrCoefficients | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:YCbCrPositioning | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:YCbCrSubSampling | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | EXIF:YResolution | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | IPTC:Byline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | IPTC:Caption | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | IPTC:City | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | IPTC:CopyrightNotice | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | IPTC:CountryCode | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | IPTC:DateCreated | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | IPTC:Headline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | IPTC:Keywords | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | IPTC:ObjectName | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | XMP:XMP-dc:Creator | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | XMP:XMP-dc:Description | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | XMP:XMP-dc:Title | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SANYO Electric Co.,Ltd. | XMP:XMP-xmp:CreateDate | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | block:EXIF | EXIF | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| SONY | block:ICC | ICC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | block:IPTC | IPTC | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| SONY | block:JFIF | JFIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| SONY | block:XMP | XMP | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| SONY | DIMENSIONS:height | DIMENSIONS | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| SONY | DIMENSIONS:width | DIMENSIONS | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:Acceleration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:ApertureValue | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| SONY | EXIF:Artist | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:BitsPerSample | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| SONY | EXIF:BodySerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:BrightnessValue | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| SONY | EXIF:CameraElevationAngle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:CameraFirmware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:CameraOwnerName | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:CFAPattern | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:ChromaticAberrationCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:ColorSpace | EXIF | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:ComponentsConfiguration | EXIF | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:CompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:CompressedBitsPerPixel | EXIF | 5 | 0 | 5 | 0 | 0 | 0 | 0 |
| SONY | EXIF:Compression | EXIF | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:Contrast | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:Copyright | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:CustomRendered | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:DateTime | EXIF | 5 | 0 | 5 | 0 | 0 | 0 | 0 |
| SONY | EXIF:DateTimeDigitized | EXIF | 5 | 0 | 5 | 0 | 0 | 0 | 0 |
| SONY | EXIF:DateTimeOriginal | EXIF | 5 | 0 | 5 | 0 | 0 | 0 | 0 |
| SONY | EXIF:DevelopmentType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:DevelopmentTypeDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:DeviceSettingDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:DigitalZoomRatio | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| SONY | EXIF:DistortionCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:ExifIFDPointer | EXIF | 5 | 0 | 0 | 0 | 0 | 5 | 0 |
| SONY | EXIF:ExifVersion | EXIF | 5 | 0 | 5 | 0 | 0 | 0 | 0 |
| SONY | EXIF:ExposureBiasValue | EXIF | 5 | 0 | 5 | 0 | 0 | 0 | 0 |
| SONY | EXIF:ExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:ExposureMode | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:ExposureProgram | EXIF | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:ExposureTime | EXIF | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| SONY | EXIF:FileSource | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:Flash | EXIF | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:FlashEnergy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:FlashpixVersion | EXIF | 5 | 0 | 5 | 0 | 0 | 0 | 0 |
| SONY | EXIF:FNumber | EXIF | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| SONY | EXIF:FocalLength | EXIF | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| SONY | EXIF:FocalLengthIn35mmFilm | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:FocalPlaneResolutionUnit | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:FocalPlaneXResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:FocalPlaneYResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:GainControl | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:Gamma | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:GPSAltitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:GPSAltitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:GPSAreaInformation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:GPSDateStamp | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:GPSDestBearing | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:GPSDestBearingRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:GPSDestDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:GPSDestDistanceRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:GPSDestLatitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:GPSDestLatitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:GPSDestLongitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:GPSDestLongitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:GPSDifferential | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:GPSDOP | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:GPSHPositioningError | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:GPSImgDirection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:GPSImgDirectionRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:GPSInfoIFDPointer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:GPSLatitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:GPSLatitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:GPSLongitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:GPSLongitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:GPSMapDatum | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:GPSMeasureMode | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:GPSProcessingMethod | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:GPSSatellites | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:GPSSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:GPSSpeedRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:GPSStatus | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:GPSTimeStamp | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:GPSTrack | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:GPSTrackRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:GPSVersionID | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:Humidity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:ImageDescription | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:ImageEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:ImageEditor | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:ImageLength | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:ImageTitle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:ImageUniqueID | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:ImageWidth | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:InteroperabilityIFDPointer | EXIF | 4 | 0 | 0 | 0 | 0 | 4 | 0 |
| SONY | EXIF:InteroperabilityIndex | EXIF | 4 | 0 | 0 | 0 | 0 | 4 | 0 |
| SONY | EXIF:InteroperabilityVersion | EXIF | 4 | 0 | 0 | 0 | 0 | 4 | 0 |
| SONY | EXIF:ISOSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:ISOSpeedLatitudeyyy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:ISOSpeedLatitudezzz | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:ISOSpeedRatings | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:JPEGInterchangeFormat | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:JPEGInterchangeFormatLength | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:LearningOptOutIn | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:LensMake | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:LensModel | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:LensSerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:LensSpecification | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| SONY | EXIF:LightSource | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:Make | EXIF | 5 | 4 | 1 | 0 | 0 | 0 | 0 |
| SONY | EXIF:MakerNote | EXIF | 2 | 0 | 0 | 0 | 0 | 2 | 0 |
| SONY | EXIF:MaxApertureValue | EXIF | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| SONY | EXIF:MetadataEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:MeteringMode | EXIF | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:Model | EXIF | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:NoiseReduction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:OECF | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:OffsetTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:OffsetTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:OffsetTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:Orientation | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:Photographer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:PhotometricInterpretation | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:PixelXDimension | EXIF | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:PixelYDimension | EXIF | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:PlanarConfiguration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:Pressure | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:PrimaryChromaticities | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:RAWDevelopingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:RecommendedExposureIndex | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:ReferenceBlackWhite | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:RelatedImageFileFormat | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:RelatedImageLength | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| SONY | EXIF:RelatedImageWidth | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:RelatedSoundFile | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:ResolutionUnit | EXIF | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:RowsPerStrip | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:SamplesPerPixel | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:Saturation | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:SceneCaptureType | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:SceneType | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:SensingMethod | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:SensitivityType | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:ShadingCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:Sharpness | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:ShutterSpeedValue | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| SONY | EXIF:Software | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:SourceExposureTimesOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:SourceImageNumberOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:SpatialFrequencyResponse | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:SpectralSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:StandardOutputSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:StripByteCounts | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:StripOffsets | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:SubjectArea | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:SubjectDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:SubjectDistanceRange | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:SubjectLocation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:SubSecTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:SubSecTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:SubSecTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:Temperature | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:TransferFunction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:UserComment | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| SONY | EXIF:WaterDepth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:WhiteBalance | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:WhitePoint | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:XResolution | EXIF | 5 | 0 | 5 | 0 | 0 | 0 | 0 |
| SONY | EXIF:YCbCrCoefficients | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:YCbCrPositioning | EXIF | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:YCbCrSubSampling | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:YResolution | EXIF | 5 | 0 | 5 | 0 | 0 | 0 | 0 |
| SONY | IPTC:Byline | IPTC | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| SONY | IPTC:Caption | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | IPTC:City | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | IPTC:CopyrightNotice | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | IPTC:CountryCode | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | IPTC:DateCreated | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | IPTC:Headline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | IPTC:Keywords | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | IPTC:ObjectName | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | XMP:XMP-dc:Creator | XMP | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| SONY | XMP:XMP-dc:Description | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | XMP:XMP-dc:Title | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | XMP:XMP-xmp:CreateDate | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | block:EXIF | EXIF | 35 | 33 | 0 | 0 | 0 | 0 | 2 |
| unknown | block:ICC | ICC | 22 | 21 | 0 | 0 | 0 | 1 | 0 |
| unknown | block:IPTC | IPTC | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| unknown | block:JFIF | JFIF | 28 | 28 | 0 | 0 | 0 | 0 | 0 |
| unknown | block:XMP | XMP | 15 | 15 | 0 | 0 | 0 | 0 | 0 |
| unknown | DIMENSIONS:height | DIMENSIONS | 45 | 37 | 0 | 0 | 0 | 8 | 0 |
| unknown | DIMENSIONS:width | DIMENSIONS | 45 | 37 | 0 | 0 | 0 | 8 | 0 |
| unknown | EXIF:Acceleration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:ApertureValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:Artist | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:BitsPerSample | EXIF | 9 | 0 | 9 | 0 | 0 | 0 | 0 |
| unknown | EXIF:BodySerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:BrightnessValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:CameraElevationAngle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:CameraFirmware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:CameraOwnerName | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:CFAPattern | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:ChromaticAberrationCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:ColorSpace | EXIF | 6 | 6 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:ComponentsConfiguration | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:CompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:CompressedBitsPerPixel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:Compression | EXIF | 11 | 11 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:Contrast | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:Copyright | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:CustomRendered | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:DateTime | EXIF | 9 | 0 | 9 | 0 | 0 | 0 | 0 |
| unknown | EXIF:DateTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:DateTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 1 | 0 | 0 |
| unknown | EXIF:DevelopmentType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:DevelopmentTypeDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:DeviceSettingDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:DigitalZoomRatio | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:DistortionCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:ExifIFDPointer | EXIF | 23 | 0 | 0 | 0 | 0 | 23 | 0 |
| unknown | EXIF:ExifVersion | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| unknown | EXIF:ExposureBiasValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:ExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:ExposureMode | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:ExposureProgram | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:ExposureTime | EXIF | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| unknown | EXIF:FileSource | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:Flash | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:FlashEnergy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:FlashpixVersion | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| unknown | EXIF:FNumber | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| unknown | EXIF:FocalLength | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| unknown | EXIF:FocalLengthIn35mmFilm | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:FocalPlaneResolutionUnit | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:FocalPlaneXResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:FocalPlaneYResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:GainControl | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:Gamma | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:GPSAltitude | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| unknown | EXIF:GPSAltitudeRef | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:GPSAreaInformation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:GPSDateStamp | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| unknown | EXIF:GPSDestBearing | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:GPSDestBearingRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:GPSDestDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:GPSDestDistanceRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:GPSDestLatitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:GPSDestLatitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:GPSDestLongitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:GPSDestLongitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:GPSDifferential | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:GPSDOP | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:GPSHPositioningError | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:GPSImgDirection | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| unknown | EXIF:GPSImgDirectionRef | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:GPSInfoIFDPointer | EXIF | 2 | 0 | 0 | 0 | 0 | 2 | 0 |
| unknown | EXIF:GPSLatitude | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:GPSLatitudeRef | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:GPSLongitude | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:GPSLongitudeRef | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:GPSMapDatum | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:GPSMeasureMode | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:GPSProcessingMethod | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:GPSSatellites | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:GPSSpeed | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| unknown | EXIF:GPSSpeedRef | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:GPSStatus | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:GPSTimeStamp | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| unknown | EXIF:GPSTrack | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:GPSTrackRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:GPSVersionID | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:Humidity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:ImageDescription | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:ImageEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:ImageEditor | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:ImageLength | EXIF | 9 | 9 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:ImageTitle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:ImageUniqueID | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:ImageWidth | EXIF | 9 | 9 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:InteroperabilityIFDPointer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:InteroperabilityIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:InteroperabilityVersion | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:ISOSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:ISOSpeedLatitudeyyy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:ISOSpeedLatitudezzz | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:ISOSpeedRatings | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:JPEGInterchangeFormat | EXIF | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:JPEGInterchangeFormatLength | EXIF | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:LearningOptOutIn | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:LensMake | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:LensModel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:LensSerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:LensSpecification | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:LightSource | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:Make | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:MakerNote | EXIF | 2 | 0 | 0 | 0 | 0 | 2 | 0 |
| unknown | EXIF:MaxApertureValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:MetadataEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:MeteringMode | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:Model | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:NoiseReduction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:OECF | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:OffsetTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:OffsetTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:OffsetTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:Orientation | EXIF | 30 | 30 | 0 | 0 | 1 | 0 | 0 |
| unknown | EXIF:Photographer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:PhotometricInterpretation | EXIF | 9 | 9 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:PixelXDimension | EXIF | 20 | 20 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:PixelYDimension | EXIF | 20 | 20 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:PlanarConfiguration | EXIF | 8 | 8 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:Pressure | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:PrimaryChromaticities | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:RAWDevelopingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:RecommendedExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:ReferenceBlackWhite | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:RelatedImageFileFormat | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:RelatedImageLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:RelatedImageWidth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:RelatedSoundFile | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:ResolutionUnit | EXIF | 25 | 25 | 0 | 0 | 1 | 0 | 0 |
| unknown | EXIF:RowsPerStrip | EXIF | 8 | 8 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:SamplesPerPixel | EXIF | 9 | 9 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:Saturation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:SceneCaptureType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:SceneType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:SensingMethod | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:SensitivityType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:ShadingCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:Sharpness | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:ShutterSpeedValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:Software | EXIF | 10 | 10 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:SourceExposureTimesOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:SourceImageNumberOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:SpatialFrequencyResponse | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:SpectralSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:StandardOutputSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:StripByteCounts | EXIF | 8 | 3 | 1 | 0 | 0 | 0 | 4 |
| unknown | EXIF:StripOffsets | EXIF | 8 | 3 | 1 | 0 | 0 | 0 | 4 |
| unknown | EXIF:SubjectArea | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:SubjectDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:SubjectDistanceRange | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:SubjectLocation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:SubSecTime | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| unknown | EXIF:SubSecTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:SubSecTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 1 | 0 | 0 |
| unknown | EXIF:Temperature | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:TransferFunction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:UserComment | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| unknown | EXIF:WaterDepth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:WhiteBalance | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:WhitePoint | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:XResolution | EXIF | 25 | 0 | 25 | 0 | 1 | 0 | 0 |
| unknown | EXIF:YCbCrCoefficients | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:YCbCrPositioning | EXIF | 4 | 4 | 0 | 0 | 1 | 0 | 0 |
| unknown | EXIF:YCbCrSubSampling | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:YResolution | EXIF | 25 | 0 | 25 | 0 | 1 | 0 | 0 |
| unknown | IPTC:Byline | IPTC | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| unknown | IPTC:Caption | IPTC | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| unknown | IPTC:City | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | IPTC:CopyrightNotice | IPTC | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| unknown | IPTC:CountryCode | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | IPTC:DateCreated | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | IPTC:Headline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | IPTC:Keywords | IPTC | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| unknown | IPTC:ObjectName | IPTC | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| unknown | XMP:XMP-dc:Creator | XMP | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| unknown | XMP:XMP-dc:Description | XMP | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| unknown | XMP:XMP-dc:Title | XMP | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| unknown | XMP:XMP-xmp:CreateDate | XMP | 9 | 0 | 9 | 0 | 1 | 0 | 0 |
| WWL | block:EXIF | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| WWL | block:ICC | ICC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | block:IPTC | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | block:JFIF | JFIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| WWL | block:XMP | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | DIMENSIONS:height | DIMENSIONS | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| WWL | DIMENSIONS:width | DIMENSIONS | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:Acceleration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:ApertureValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:Artist | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:BitsPerSample | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:BodySerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:BrightnessValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:CameraElevationAngle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:CameraFirmware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:CameraOwnerName | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:CFAPattern | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:ChromaticAberrationCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:ColorSpace | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:ComponentsConfiguration | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:CompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:CompressedBitsPerPixel | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| WWL | EXIF:Compression | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:Contrast | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:Copyright | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:CustomRendered | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:DateTime | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| WWL | EXIF:DateTimeDigitized | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| WWL | EXIF:DateTimeOriginal | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| WWL | EXIF:DevelopmentType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:DevelopmentTypeDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:DeviceSettingDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:DigitalZoomRatio | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:DistortionCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:ExifIFDPointer | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| WWL | EXIF:ExifVersion | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| WWL | EXIF:ExposureBiasValue | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| WWL | EXIF:ExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:ExposureMode | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:ExposureProgram | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:ExposureTime | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| WWL | EXIF:FileSource | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:Flash | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:FlashEnergy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:FlashpixVersion | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| WWL | EXIF:FNumber | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| WWL | EXIF:FocalLength | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| WWL | EXIF:FocalLengthIn35mmFilm | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:FocalPlaneResolutionUnit | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:FocalPlaneXResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:FocalPlaneYResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:GainControl | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:Gamma | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:GPSAltitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:GPSAltitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:GPSAreaInformation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:GPSDateStamp | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:GPSDestBearing | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:GPSDestBearingRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:GPSDestDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:GPSDestDistanceRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:GPSDestLatitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:GPSDestLatitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:GPSDestLongitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:GPSDestLongitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:GPSDifferential | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:GPSDOP | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:GPSHPositioningError | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:GPSImgDirection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:GPSImgDirectionRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:GPSInfoIFDPointer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:GPSLatitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:GPSLatitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:GPSLongitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:GPSLongitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:GPSMapDatum | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:GPSMeasureMode | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:GPSProcessingMethod | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:GPSSatellites | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:GPSSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:GPSSpeedRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:GPSStatus | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:GPSTimeStamp | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:GPSTrack | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:GPSTrackRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:GPSVersionID | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:Humidity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:ImageDescription | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:ImageEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:ImageEditor | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:ImageLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:ImageTitle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:ImageUniqueID | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:ImageWidth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:InteroperabilityIFDPointer | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| WWL | EXIF:InteroperabilityIndex | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| WWL | EXIF:InteroperabilityVersion | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| WWL | EXIF:ISOSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:ISOSpeedLatitudeyyy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:ISOSpeedLatitudezzz | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:ISOSpeedRatings | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:JPEGInterchangeFormat | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:JPEGInterchangeFormatLength | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:LearningOptOutIn | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:LensMake | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:LensModel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:LensSerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:LensSpecification | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:LightSource | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:Make | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| WWL | EXIF:MakerNote | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:MaxApertureValue | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| WWL | EXIF:MetadataEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:MeteringMode | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:Model | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| WWL | EXIF:NoiseReduction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:OECF | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:OffsetTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:OffsetTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:OffsetTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:Orientation | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:Photographer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:PhotometricInterpretation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:PixelXDimension | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:PixelYDimension | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:PlanarConfiguration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:Pressure | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:PrimaryChromaticities | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:RAWDevelopingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:RecommendedExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:ReferenceBlackWhite | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:RelatedImageFileFormat | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:RelatedImageLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:RelatedImageWidth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:RelatedSoundFile | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:ResolutionUnit | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:RowsPerStrip | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:SamplesPerPixel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:Saturation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:SceneCaptureType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:SceneType | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:SensingMethod | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:SensitivityType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:ShadingCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:Sharpness | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:ShutterSpeedValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:Software | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:SourceExposureTimesOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:SourceImageNumberOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:SpatialFrequencyResponse | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:SpectralSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:StandardOutputSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:StripByteCounts | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:StripOffsets | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:SubjectArea | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:SubjectDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:SubjectDistanceRange | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:SubjectLocation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:SubSecTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:SubSecTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:SubSecTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:Temperature | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:TransferFunction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:UserComment | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:WaterDepth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:WhiteBalance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:WhitePoint | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:XResolution | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| WWL | EXIF:YCbCrCoefficients | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:YCbCrPositioning | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:YCbCrSubSampling | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | EXIF:YResolution | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| WWL | IPTC:Byline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | IPTC:Caption | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | IPTC:City | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | IPTC:CopyrightNotice | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | IPTC:CountryCode | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | IPTC:DateCreated | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | IPTC:Headline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | IPTC:Keywords | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | IPTC:ObjectName | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | XMP:XMP-dc:Creator | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | XMP:XMP-dc:Description | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | XMP:XMP-dc:Title | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WWL | XMP:XMP-xmp:CreateDate | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | block:EXIF | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | block:ICC | ICC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | block:IPTC | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | block:JFIF | JFIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | block:XMP | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | DIMENSIONS:height | DIMENSIONS | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | DIMENSIONS:width | DIMENSIONS | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:Acceleration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:ApertureValue | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:Artist | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:BitsPerSample | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:BodySerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:BrightnessValue | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:CameraElevationAngle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:CameraFirmware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:CameraOwnerName | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:CFAPattern | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:ChromaticAberrationCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:ColorSpace | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:ComponentsConfiguration | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:CompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:CompressedBitsPerPixel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:Compression | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:Contrast | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:Copyright | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:CustomRendered | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:DateTime | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:DateTimeDigitized | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:DateTimeOriginal | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:DevelopmentType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:DevelopmentTypeDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:DeviceSettingDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:DigitalZoomRatio | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:DistortionCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:ExifIFDPointer | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| Xiaomi | EXIF:ExifVersion | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:ExposureBiasValue | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:ExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:ExposureMode | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:ExposureProgram | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:ExposureTime | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:FileSource | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:Flash | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:FlashEnergy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:FlashpixVersion | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:FNumber | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:FocalLength | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:FocalLengthIn35mmFilm | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:FocalPlaneResolutionUnit | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:FocalPlaneXResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:FocalPlaneYResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:GainControl | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:Gamma | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:GPSAltitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:GPSAltitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:GPSAreaInformation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:GPSDateStamp | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:GPSDestBearing | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:GPSDestBearingRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:GPSDestDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:GPSDestDistanceRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:GPSDestLatitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:GPSDestLatitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:GPSDestLongitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:GPSDestLongitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:GPSDifferential | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:GPSDOP | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:GPSHPositioningError | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:GPSImgDirection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:GPSImgDirectionRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:GPSInfoIFDPointer | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| Xiaomi | EXIF:GPSLatitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:GPSLatitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:GPSLongitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:GPSLongitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:GPSMapDatum | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:GPSMeasureMode | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:GPSProcessingMethod | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:GPSSatellites | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:GPSSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:GPSSpeedRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:GPSStatus | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:GPSTimeStamp | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:GPSTrack | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:GPSTrackRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:GPSVersionID | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:Humidity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:ImageDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:ImageEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:ImageEditor | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:ImageLength | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:ImageTitle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:ImageUniqueID | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:ImageWidth | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:InteroperabilityIFDPointer | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| Xiaomi | EXIF:InteroperabilityIndex | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| Xiaomi | EXIF:InteroperabilityVersion | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| Xiaomi | EXIF:ISOSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:ISOSpeedLatitudeyyy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:ISOSpeedLatitudezzz | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:ISOSpeedRatings | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:JPEGInterchangeFormat | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:JPEGInterchangeFormatLength | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:LearningOptOutIn | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:LensMake | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:LensModel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:LensSerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:LensSpecification | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:LightSource | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:Make | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:MakerNote | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:MaxApertureValue | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:MetadataEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:MeteringMode | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:Model | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:NoiseReduction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:OECF | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:OffsetTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:OffsetTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:OffsetTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:Orientation | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:Photographer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:PhotometricInterpretation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:PixelXDimension | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:PixelYDimension | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:PlanarConfiguration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:Pressure | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:PrimaryChromaticities | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:RAWDevelopingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:RecommendedExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:ReferenceBlackWhite | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:RelatedImageFileFormat | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:RelatedImageLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:RelatedImageWidth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:RelatedSoundFile | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:ResolutionUnit | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:RowsPerStrip | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:SamplesPerPixel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:Saturation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:SceneCaptureType | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:SceneType | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:SensingMethod | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:SensitivityType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:ShadingCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:Sharpness | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:ShutterSpeedValue | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:Software | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:SourceExposureTimesOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:SourceImageNumberOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:SpatialFrequencyResponse | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:SpectralSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:StandardOutputSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:StripByteCounts | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:StripOffsets | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:SubjectArea | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:SubjectDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:SubjectDistanceRange | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:SubjectLocation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:SubSecTime | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:SubSecTimeDigitized | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:SubSecTimeOriginal | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:Temperature | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:TransferFunction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:UserComment | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:WaterDepth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:WhiteBalance | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:WhitePoint | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:XResolution | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:YCbCrCoefficients | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:YCbCrPositioning | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:YCbCrSubSampling | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | EXIF:YResolution | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Xiaomi | IPTC:Byline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | IPTC:Caption | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | IPTC:City | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | IPTC:CopyrightNotice | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | IPTC:CountryCode | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | IPTC:DateCreated | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | IPTC:Headline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | IPTC:Keywords | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | IPTC:ObjectName | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | XMP:XMP-dc:Creator | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | XMP:XMP-dc:Description | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | XMP:XMP-dc:Title | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Xiaomi | XMP:XMP-xmp:CreateDate | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

## Per-format totals

| format | found | matched | normalized | mismatched | missing local | missing reference | non-comparable |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| heif | 118 | 71 | 37 | 0 | 7 | 8 | 2 |
| jpeg | 3527 | 2143 | 1050 | 0 | 17 | 334 | 0 |
| tiff | 128 | 88 | 16 | 0 | 0 | 16 | 8 |

## Per-corpus totals

| corpus | found | matched | normalized | mismatched | missing local | missing reference | non-comparable |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| ianare-exif-py | 3773 | 2302 | 1103 | 0 | 24 | 358 | 10 |

## Per-metadata-family totals

| family | found | matched | normalized | mismatched | missing local | missing reference | non-comparable |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| DIMENSIONS | 216 | 200 | 0 | 0 | 0 | 16 | 0 |
| EXIF | 3377 | 1944 | 1087 | 0 | 23 | 336 | 10 |
| ICC | 28 | 27 | 0 | 0 | 0 | 1 | 0 |
| IPTC | 28 | 21 | 2 | 0 | 0 | 5 | 0 |
| JFIF | 56 | 56 | 0 | 0 | 0 | 0 | 0 |
| XMP | 68 | 54 | 14 | 0 | 1 | 0 | 0 |

## Per-corpus field results

| corpus | field | family | found | matched | normalized | mismatched | missing local | missing reference | non-comparable |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| ianare-exif-py | block:EXIF | EXIF | 98 | 96 | 0 | 0 | 0 | 0 | 2 |
| ianare-exif-py | block:ICC | ICC | 28 | 27 | 0 | 0 | 0 | 1 | 0 |
| ianare-exif-py | block:IPTC | IPTC | 11 | 9 | 0 | 0 | 0 | 2 | 0 |
| ianare-exif-py | block:JFIF | JFIF | 56 | 56 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | block:XMP | XMP | 38 | 38 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | DIMENSIONS:height | DIMENSIONS | 108 | 100 | 0 | 0 | 0 | 8 | 0 |
| ianare-exif-py | DIMENSIONS:width | DIMENSIONS | 108 | 100 | 0 | 0 | 0 | 8 | 0 |
| ianare-exif-py | EXIF:Acceleration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:ApertureValue | EXIF | 32 | 0 | 32 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:Artist | EXIF | 11 | 7 | 0 | 0 | 0 | 4 | 0 |
| ianare-exif-py | EXIF:BitsPerSample | EXIF | 11 | 0 | 11 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:BodySerialNumber | EXIF | 2 | 1 | 1 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:BrightnessValue | EXIF | 14 | 0 | 14 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:CameraElevationAngle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:CameraFirmware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:CameraOwnerName | EXIF | 2 | 0 | 0 | 0 | 0 | 2 | 0 |
| ianare-exif-py | EXIF:CFAPattern | EXIF | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:ChromaticAberrationCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:ColorSpace | EXIF | 64 | 64 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:ComponentsConfiguration | EXIF | 56 | 55 | 1 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:CompositeImage | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:CompressedBitsPerPixel | EXIF | 34 | 0 | 33 | 0 | 0 | 1 | 0 |
| ianare-exif-py | EXIF:Compression | EXIF | 66 | 66 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:Contrast | EXIF | 23 | 23 | 0 | 0 | 1 | 0 | 0 |
| ianare-exif-py | EXIF:Copyright | EXIF | 18 | 9 | 9 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:CustomRendered | EXIF | 35 | 35 | 0 | 0 | 3 | 0 | 0 |
| ianare-exif-py | EXIF:DateTime | EXIF | 67 | 0 | 67 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:DateTimeDigitized | EXIF | 57 | 0 | 57 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:DateTimeOriginal | EXIF | 62 | 0 | 62 | 0 | 1 | 0 | 0 |
| ianare-exif-py | EXIF:DevelopmentType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:DevelopmentTypeDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:DeviceSettingDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:DigitalZoomRatio | EXIF | 33 | 0 | 32 | 0 | 1 | 1 | 0 |
| ianare-exif-py | EXIF:DistortionCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:ExifIFDPointer | EXIF | 86 | 0 | 0 | 0 | 0 | 86 | 0 |
| ianare-exif-py | EXIF:ExifVersion | EXIF | 61 | 1 | 60 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:ExposureBiasValue | EXIF | 58 | 0 | 58 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:ExposureIndex | EXIF | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:ExposureMode | EXIF | 40 | 40 | 0 | 0 | 2 | 0 | 0 |
| ianare-exif-py | EXIF:ExposureProgram | EXIF | 48 | 48 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:ExposureTime | EXIF | 59 | 0 | 59 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:FileSource | EXIF | 45 | 45 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:Flash | EXIF | 65 | 65 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:FlashEnergy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:FlashpixVersion | EXIF | 57 | 1 | 56 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:FNumber | EXIF | 62 | 0 | 62 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:FocalLength | EXIF | 62 | 0 | 62 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:FocalLengthIn35mmFilm | EXIF | 26 | 26 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:FocalPlaneResolutionUnit | EXIF | 16 | 16 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:FocalPlaneXResolution | EXIF | 16 | 0 | 16 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:FocalPlaneYResolution | EXIF | 16 | 0 | 16 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:GainControl | EXIF | 21 | 21 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:Gamma | EXIF | 0 | 0 | 0 | 0 | 1 | 0 | 0 |
| ianare-exif-py | EXIF:GPSAltitude | EXIF | 7 | 0 | 7 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:GPSAltitudeRef | EXIF | 15 | 15 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:GPSAreaInformation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:GPSDateStamp | EXIF | 15 | 0 | 15 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:GPSDestBearing | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:GPSDestBearingRef | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:GPSDestDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:GPSDestDistanceRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:GPSDestLatitude | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:GPSDestLatitudeRef | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:GPSDestLongitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:GPSDestLongitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:GPSDifferential | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:GPSDOP | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:GPSHPositioningError | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:GPSImgDirection | EXIF | 7 | 0 | 7 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:GPSImgDirectionRef | EXIF | 16 | 16 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:GPSInfoIFDPointer | EXIF | 26 | 0 | 0 | 0 | 0 | 26 | 0 |
| ianare-exif-py | EXIF:GPSLatitude | EXIF | 20 | 19 | 0 | 0 | 0 | 1 | 0 |
| ianare-exif-py | EXIF:GPSLatitudeRef | EXIF | 20 | 20 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:GPSLongitude | EXIF | 20 | 19 | 0 | 0 | 0 | 1 | 0 |
| ianare-exif-py | EXIF:GPSLongitudeRef | EXIF | 20 | 20 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:GPSMapDatum | EXIF | 10 | 10 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:GPSMeasureMode | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:GPSProcessingMethod | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:GPSSatellites | EXIF | 9 | 9 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:GPSSpeed | EXIF | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:GPSSpeedRef | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:GPSStatus | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:GPSTimeStamp | EXIF | 15 | 0 | 15 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:GPSTrack | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:GPSTrackRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:GPSVersionID | EXIF | 8 | 8 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:Humidity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:ImageDescription | EXIF | 31 | 31 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:ImageEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:ImageEditor | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:ImageLength | EXIF | 14 | 14 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:ImageTitle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:ImageUniqueID | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:ImageWidth | EXIF | 14 | 14 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:InteroperabilityIFDPointer | EXIF | 47 | 0 | 0 | 0 | 0 | 47 | 0 |
| ianare-exif-py | EXIF:InteroperabilityIndex | EXIF | 47 | 0 | 0 | 0 | 0 | 47 | 0 |
| ianare-exif-py | EXIF:InteroperabilityVersion | EXIF | 47 | 0 | 0 | 0 | 0 | 47 | 0 |
| ianare-exif-py | EXIF:ISOSpeed | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:ISOSpeedLatitudeyyy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:ISOSpeedLatitudezzz | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:ISOSpeedRatings | EXIF | 50 | 50 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:JPEGInterchangeFormat | EXIF | 59 | 59 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:JPEGInterchangeFormatLength | EXIF | 59 | 59 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:LearningOptOutIn | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:LensMake | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:LensModel | EXIF | 6 | 6 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:LensSerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:LensSpecification | EXIF | 6 | 0 | 0 | 0 | 0 | 6 | 0 |
| ianare-exif-py | EXIF:LightSource | EXIF | 36 | 36 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:Make | EXIF | 63 | 54 | 9 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:MakerNote | EXIF | 46 | 0 | 0 | 0 | 0 | 46 | 0 |
| ianare-exif-py | EXIF:MaxApertureValue | EXIF | 51 | 0 | 51 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:MetadataEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:MeteringMode | EXIF | 61 | 61 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:Model | EXIF | 63 | 53 | 10 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:NoiseReduction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:OECF | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:OffsetTime | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:OffsetTimeDigitized | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:OffsetTimeOriginal | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:Orientation | EXIF | 88 | 88 | 0 | 0 | 1 | 0 | 0 |
| ianare-exif-py | EXIF:Photographer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:PhotometricInterpretation | EXIF | 11 | 11 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:PixelXDimension | EXIF | 78 | 77 | 1 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:PixelYDimension | EXIF | 78 | 77 | 1 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:PlanarConfiguration | EXIF | 8 | 8 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:Pressure | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:PrimaryChromaticities | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:RAWDevelopingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:RecommendedExposureIndex | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:ReferenceBlackWhite | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:RelatedImageFileFormat | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:RelatedImageLength | EXIF | 8 | 0 | 0 | 0 | 0 | 8 | 0 |
| ianare-exif-py | EXIF:RelatedImageWidth | EXIF | 8 | 8 | 0 | 0 | 1 | 0 | 0 |
| ianare-exif-py | EXIF:RelatedSoundFile | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:ResolutionUnit | EXIF | 84 | 84 | 0 | 0 | 1 | 0 | 0 |
| ianare-exif-py | EXIF:RowsPerStrip | EXIF | 10 | 10 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:SamplesPerPixel | EXIF | 11 | 11 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:Saturation | EXIF | 24 | 24 | 0 | 0 | 1 | 0 | 0 |
| ianare-exif-py | EXIF:SceneCaptureType | EXIF | 39 | 39 | 0 | 0 | 2 | 0 | 0 |
| ianare-exif-py | EXIF:SceneType | EXIF | 34 | 34 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:SensingMethod | EXIF | 26 | 26 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:SensitivityType | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:ShadingCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:Sharpness | EXIF | 26 | 26 | 0 | 0 | 1 | 0 | 0 |
| ianare-exif-py | EXIF:ShutterSpeedValue | EXIF | 30 | 0 | 30 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:Software | EXIF | 57 | 51 | 6 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:SourceExposureTimesOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:SourceImageNumberOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:SpatialFrequencyResponse | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:SpectralSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:StandardOutputSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:StripByteCounts | EXIF | 10 | 5 | 1 | 0 | 0 | 0 | 4 |
| ianare-exif-py | EXIF:StripOffsets | EXIF | 10 | 5 | 1 | 0 | 0 | 0 | 4 |
| ianare-exif-py | EXIF:SubjectArea | EXIF | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:SubjectDistance | EXIF | 3 | 0 | 2 | 0 | 0 | 1 | 0 |
| ianare-exif-py | EXIF:SubjectDistanceRange | EXIF | 17 | 17 | 0 | 0 | 1 | 0 | 0 |
| ianare-exif-py | EXIF:SubjectLocation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:SubSecTime | EXIF | 8 | 2 | 6 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:SubSecTimeDigitized | EXIF | 9 | 4 | 5 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:SubSecTimeOriginal | EXIF | 9 | 4 | 5 | 0 | 1 | 0 | 0 |
| ianare-exif-py | EXIF:Temperature | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:TransferFunction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:UserComment | EXIF | 30 | 0 | 18 | 0 | 0 | 12 | 0 |
| ianare-exif-py | EXIF:WaterDepth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:WhiteBalance | EXIF | 45 | 45 | 0 | 0 | 2 | 0 | 0 |
| ianare-exif-py | EXIF:WhitePoint | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:XResolution | EXIF | 85 | 1 | 84 | 0 | 1 | 0 | 0 |
| ianare-exif-py | EXIF:YCbCrCoefficients | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:YCbCrPositioning | EXIF | 59 | 59 | 0 | 0 | 1 | 0 | 0 |
| ianare-exif-py | EXIF:YCbCrSubSampling | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | EXIF:YResolution | EXIF | 85 | 1 | 84 | 0 | 1 | 0 | 0 |
| ianare-exif-py | IPTC:Byline | IPTC | 3 | 0 | 0 | 0 | 0 | 3 | 0 |
| ianare-exif-py | IPTC:Caption | IPTC | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | IPTC:City | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | IPTC:CopyrightNotice | IPTC | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | IPTC:CountryCode | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | IPTC:DateCreated | IPTC | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| ianare-exif-py | IPTC:Headline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | IPTC:Keywords | IPTC | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | IPTC:ObjectName | IPTC | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | XMP:XMP-dc:Creator | XMP | 6 | 6 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | XMP:XMP-dc:Description | XMP | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | XMP:XMP-dc:Title | XMP | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| ianare-exif-py | XMP:XMP-xmp:CreateDate | XMP | 14 | 0 | 14 | 0 | 1 | 0 | 0 |

## Fixture hashes

| fixture | bytes | SHA-256 | format | producer |
| --- | ---: | --- | --- | --- |
| heic/heic_hdlr_box.jpg | 101897 | `f576d9c6b7c3d9531a4bc10e9fa34ecdcebdf6773a907c4892fa680b8557a279` | heif | unknown |
| heic/mobile/HMD_Nokia_8.3_5G.heif | 3019841 | `c2820b3e4e0368c6f031b28b62945658a97446895cb446dfc37acdcf7109e0f5` | heif | unknown |
| heic/mobile/HMD_Nokia_8.3_5G_hdr.heif | 865787 | `17fccf795b0e2b749b9f5667ffcea31e665cb6964fb104b001684c60a14acb4d` | heif | unknown |
| heic/mobile/iphone_13_pro_max.heic | 2182707 | `e760c80eed310e4f27c092d5487693ca8e104e7cc01d25ba4828deb28f679676` | heif | Apple |
| heic/samplefilehub.heif | 29208 | `f86ec0d3a6c82e31657bb1886e1ec95579329fa98d8be511ac1e8497c778e07f` | heif | unknown |
| heic/spring_1440x960.heic | 51899 | `2b81d5e490f310ef0779ab022ee0f700f6babdb5914b1e659df9912a1a71aa52` | heif | unknown |
| jpg/Canon_40D.jpg | 7958 | `6bfdabd4fc33d112283c147acccc574e770bbe6fbdbc3d4da968ba7b606ecc2f` | jpeg | Canon |
| jpg/Canon_40D_photoshop_import.jpg | 9686 | `40a7aa2cc28d8544b31408e6d54c568e6b749a8faf239c7a6234b315e953b9d5` | jpeg | unknown |
| jpg/Canon_DIGITAL_IXUS_400.jpg | 9198 | `23c1ec51c075d6864862412d07b9d0f07e84237af68972c1d1293e4c28f73e4f` | jpeg | Canon |
| jpg/Canon_PowerShot_S40.jpg | 32764 | `8a9d04b92d0de5836c59ede8ae421235488e4031e893e07b1fe7e4b78f6a9901` | jpeg | Canon |
| jpg/Fujifilm_FinePix6900ZOOM.jpg | 4278 | `40afc753b4e83d72cfa1080ae7a10310e0fcbb9e4f6ebdf32c7b2f1553c83fe3` | jpeg | FUJIFILM |
| jpg/Fujifilm_FinePix_E500.jpg | 2241 | `ffbee7b07bf267dc0fb52817f8866df647758f7d48ac93e7a73d1914fb4c74da` | jpeg | FUJIFILM |
| jpg/Kodak_CX7530.jpg | 5958 | `ac759931999a215ef78469a82bdfc382ccba96eb8d039ec9e81e53a9a419d35e` | jpeg | EASTMAN KODAK COMPANY |
| jpg/Konica_Minolta_DiMAGE_Z3.jpg | 36971 | `b1b914f47528384e6252fa7caabb489f123b88c81ebd62ecb8eacdf64c46fd5e` | jpeg | KONICA MINOLTA |
| jpg/Nikon_COOLPIX_P1.jpg | 7068 | `896b47424dc1c87154a50b40394ae887a0b0d7d830f38a9d969295995f27ef43` | jpeg | NIKON |
| jpg/Nikon_D70.jpg | 14034 | `8e2a627b96ca71c20129161f46bda3d338407da99bd11b1055adb27af27d7ef5` | jpeg | NIKON CORPORATION |
| jpg/Olympus_C8080WZ.jpg | 3224 | `3495de26279d8d1e442177ba43cef855438e3b321481b9ee2ff513decb13ed9c` | jpeg | OLYMPUS CORPORATION |
| jpg/PaintTool_sample.jpg | 5738 | `45e3aa44357a4b05d78b3fc51d0732be0ddf5a544b732b0134778b146380291a` | jpeg | unknown |
| jpg/Panasonic_DMC-FZ30.jpg | 10769 | `c092a4ade7ae7b63ac13d50c3dc9da51ce2fb465caf7d1b6193d4c53f59e8ad8` | jpeg | Panasonic |
| jpg/Pentax_K10D.jpg | 12077 | `146601c9d406410abdaa832508ee4ccddbc7ad54530e81d57962c1b7728e2e6d` | jpeg | PENTAX Corporation |
| jpg/Reconyx_HC500_Hyperfire.jpg | 425890 | `d7ba6bc532a225c955411cb96c733a45ee39403fa973312bded7732e6f8e4b3c` | jpeg | unknown |
| jpg/Ricoh_Caplio_RR330.jpg | 3662 | `e920d750c491f3088eeb0f31fb4659164755af11e4bbbe269430f32c3ae10928` | jpeg | Caplio |
| jpg/Samsung_Digimax_i50_MP3.jpg | 45286 | `e61da5ee8d7ba1726bd0a887216ed5ae7ca38c97fcf7aac11b808e1c269e1722` | jpeg | Samsung Techwin |
| jpg/Sony_DSLR-A200.jpg | 632566 | `a21730078d69b6300c87db44a6912979b1812dd8e6f7b131e6c4709d940423ed` | jpeg | SONY |
| jpg/Sony_HDR-HC3.jpg | 3565 | `4f707d9b40d423a5246748bc1e05b66c4b87e30863f7a51ce18904a7ec43a39e` | jpeg | SONY |
| jpg/Sony_alpha_a58.JPG | 24871 | `227f97c068d3fe038901b238580bac6440a6f172667b317fa85712388d73d9f7` | jpeg | SONY |
| jpg/WWL_Polaroid_ION230.jpg | 3998 | `27532bdce8a2ad2afc1e392f4d24105867eec0b1ba126b01b3e398100daab664` | jpeg | WWL |
| jpg/corrupted.jpg | 1960703 | `dcc801f45d7607d82661d08c4c6b188bdbf3129b55f7612830a6dc3fea573023` | jpeg | OLYMPUS IMAGING CORP. |
| jpg/exif-org/canon-ixus.jpg | 128037 | `b2d085bdb261cb2c56d8ba10d79175e38c0acd0d429afe19a4610eddee3b06fe` | jpeg | Canon |
| jpg/exif-org/fujifilm-dx10.jpg | 133074 | `7d6f8f7450f12bd768384a9cae66a9cc0f626cea023431614d967f34150def0d` | jpeg | FUJIFILM |
| jpg/exif-org/fujifilm-finepix40i.jpg | 43183 | `722fa6b893b01d5970d9b0761df6ee97bcee28fcd5b8e78d761738058c6b7822` | jpeg | FUJIFILM |
| jpg/exif-org/fujifilm-mx1700.jpg | 100227 | `f45a5d2c1c5f3ae55254239c02b569c01dd3926a64e08d4a141ce4dbff637856` | jpeg | FUJIFILM |
| jpg/exif-org/kodak-dc210.jpg | 79837 | `6da5cfdcbd2d462220da5ac1c4e0df32c61f078efe92c777036cf629fe791ad5` | jpeg | Eastman Kodak Company |
| jpg/exif-org/kodak-dc240.jpg | 81901 | `6dcac4b77b55a9f5e5c0486c1f28b8b2eb65b292d3c43499cdde47ef11d367a4` | jpeg | EASTMAN KODAK COMPANY |
| jpg/exif-org/nikon-e950.jpg | 164151 | `7920518dec63a63074ca8e1861b61f69be687b3dd0caa3eb65cdaac4c4f43fd0` | jpeg | NIKON |
| jpg/exif-org/olympus-c960.jpg | 87599 | `325671969a8059d2ad0036e2db8476262592add0ca5174c260fa03e9e455809d` | jpeg | OLYMPUS OPTICAL CO.,LTD |
| jpg/exif-org/olympus-d320l.jpg | 61264 | `6a41599dc31c73e8a9c896e2669ecfb2b03a74be04fac0dd9371ed457e50a762` | jpeg | unknown |
| jpg/exif-org/ricoh-rdc5300.jpg | 87626 | `16182006e2f82e60f11e0bad3964cac539bba4e58d14a3152bfe5aeb1907ab19` | jpeg | RICOH |
| jpg/exif-org/sanyo-vpcg250.jpg | 62096 | `4723c892d4d3c200074f3a8a437b0d3e62e631e140b68e2386a54c45f0da2566` | jpeg | SANYO Electric Co.,Ltd. |
| jpg/exif-org/sanyo-vpcsx550.jpg | 102448 | `74401cc6e0b6bdb03b7d3a1c99a0ba3b4dd5b3ac9b7728a38f6fb3607f3360ea` | jpeg | SANYO Electric Co.,Ltd. |
| jpg/exif-org/sony-cybershot.jpg | 63643 | `0e69b12f261907dc9fcfb89082a6a61948db849d836673017a7e972d49184404` | jpeg | SONY |
| jpg/exif-org/sony-d700.jpg | 79446 | `8ff0028190b36a6c4af79989b248dd5e949d289d32c5f0e005be2db45d363c98` | jpeg | SONY |
| jpg/exif-org/sony-powershota5.jpg | 58405 | `608c6c0a57205c42ca4169b5574823ed1c05e4e636a038cda64b6ef18ae5d274` | jpeg | unknown |
| jpg/gps/DSCN0010.jpg | 161713 | `17307b1207eb6487d7908e9d154890b46e3d2e0192369cfd3f4c33d5a5af4035` | jpeg | NIKON |
| jpg/gps/DSCN0012.jpg | 159137 | `84d60184ac4098b7967e2ef6dae6b03fc0d98b24624d2b57412dbcd7cb864680` | jpeg | NIKON |
| jpg/gps/DSCN0021.jpg | 157382 | `441daaea545eb8bdb1434817fc36be0baa8992a4c9ad4b089726033bfc4bc963` | jpeg | NIKON |
| jpg/gps/DSCN0025.jpg | 150301 | `9437619d5ab1afe7740d546effe76ffe52548af68b9be72cef259d0cd1f9c90b` | jpeg | NIKON |
| jpg/gps/DSCN0027.jpg | 157723 | `0a7864e5fa07cc118f3df1e38f31e5181350c30010e8115c536c7a8a664c9f13` | jpeg | NIKON |
| jpg/gps/DSCN0029.jpg | 150085 | `941b9c7bfe35e0a3775f013e613748f55d1152736a74bd51e34f1b66bd646697` | jpeg | NIKON |
| jpg/gps/DSCN0038.jpg | 157569 | `84792ae83e6ec83a5d909be82f68e51aeea67fdd6a7019993fdac4be4f6e6a72` | jpeg | NIKON |
| jpg/gps/DSCN0040.jpg | 152893 | `14f6453d145c69c96e77c7e901cdbf58f7984c09fe4ab65ca8914c5d0d37e956` | jpeg | NIKON |
| jpg/gps/DSCN0042.jpg | 156695 | `03837b2881d4cc7e5e03191b301f082088f999e4aa59e4489193874c93c31579` | jpeg | NIKON |
| jpg/hdr/canon_hdr_NO.jpg | 784371 | `fa2127ebab1b3930c998ab262795044262f41dda7eaf0f7a21a773cff48c8696` | jpeg | Canon |
| jpg/hdr/canon_hdr_YES.jpg | 722875 | `30603e14619140acaea51bee6fecab4a72956d1aa570e20f5b9b3d9271b8bdf4` | jpeg | Canon |
| jpg/hdr/iphone_hdr_NO.jpg | 1957448 | `eb81d33a9b1d1bea5d133483f918c2cc927161c0dda44c9fedfa4da87c8b1cc3` | jpeg | Apple |
| jpg/hdr/iphone_hdr_YES.jpg | 1976579 | `5125870f6f4a94a2329bc9f53482680772d3277399aed71c2f0636cb07870533` | jpeg | Apple |
| jpg/invalid/image00971.jpg | 164210 | `4793aef30d2d042f15723bf22fa8c5b9932c6b5e97bc090e7a82c0845b2a47db` | jpeg | unknown |
| jpg/invalid/image01088.jpg | 87107 | `99366772dd3e323d52bf6667b2955c8a2859f0ba9d88d96c2c0a0ade16d96d9e` | jpeg | unknown |
| jpg/invalid/image01137.jpg | 26898 | `d28160c63cbb4c9a9709e917b1bf0208d6240d1d3e22b28ec23abb08f957c52c` | jpeg | unknown |
| jpg/invalid/image01551.jpg | 15994 | `ef8e654304d58238af70f4ba8f52b095c8d801ebba0dfb6b089b53d835c36c5a` | jpeg | unknown |
| jpg/invalid/image01713.jpg | 17412 | `5281b682dc913fee5a3b7d172bfb8c8068a1bcc3138c3d29f98db34bc807798c` | jpeg | unknown |
| jpg/invalid/image01980.jpg | 17857 | `0eda850fefce6ae4c148815bfb20962309b75e542de421845615ccef7a962f00` | jpeg | unknown |
| jpg/invalid/image02206.jpg | 14574 | `527ae341310acbdeedf60d1087a23081ed279e3e6ecdd7e4b82d586acfbc0735` | jpeg | unknown |
| jpg/long_description.jpg | 7585 | `1a6e4a1b7fab604027cbb52b6cde75f6966c8b9a2eb3ea0fba5e1bf59605a339` | jpeg | unknown |
| jpg/mobile/HMD_Nokia_8.3_5G.jpg | 2190194 | `9be023624ccd5846beeb5b02d9b571251ef5bd8ed820389a430d114029f58eda` | jpeg | HMD Global |
| jpg/mobile/HMD_Nokia_8.3_5G_hdr.jpg | 5168013 | `b150f64e631b0df0f70cdbb88ddcbb73c5536fcb840ace8d0e71f8d58d997bc1` | jpeg | HMD Global |
| jpg/mobile/jolla.jpg | 811904 | `ee6bc1200cf8b1b26f5b60d8294d9617e8099f6dfdd7a4757a424f332360f5e3` | jpeg | Jolla |
| jpg/orientation/landscape_1.jpg | 139435 | `87ea27ba9f24cb133251850a7ebd11427ba5e4be0a3a8534a58b00041b2db06d` | jpeg | unknown |
| jpg/orientation/landscape_2.jpg | 137359 | `47aa72c02bd24b17db58cd8e25a57dd97f54abc9461fc1fb8bf2d8889d8494a5` | jpeg | unknown |
| jpg/orientation/landscape_3.jpg | 140965 | `533f2e6d35a62e9bc144dbb3921a9b2105cf2498eaafb10812f197e6108bd758` | jpeg | unknown |
| jpg/orientation/landscape_4.jpg | 140588 | `552568f6965f76c94fced5cd3286775fcc7746fbc796f7a7ab8e7c8d533b666c` | jpeg | unknown |
| jpg/orientation/landscape_5.jpg | 137611 | `592f903706fe4b215a08adbd0ed8b62d28aad4e6532ee13777f4aa12787f54a7` | jpeg | unknown |
| jpg/orientation/landscape_6.jpg | 137628 | `a05082c57819232106a0612f57268efab011f7a2a477483b878a2b4509cd8e59` | jpeg | unknown |
| jpg/orientation/landscape_7.jpg | 140645 | `e5273d4ea5fddcaf27fefc7ea4162c2b3c77ad056e2d8d65a5d61787b5b15db4` | jpeg | unknown |
| jpg/orientation/landscape_8.jpg | 141286 | `5b5c9979cbf6077e97894488be20c849b5eb008fe685c0cb75060c4ab6812ce0` | jpeg | unknown |
| jpg/orientation/portrait_1.jpg | 129059 | `31b06a687d094aabaab611bbdb83b37bee044d7411087e24120169a8a7d5a511` | jpeg | unknown |
| jpg/orientation/portrait_2.jpg | 136072 | `f0b06c75694f6d97e17121dae0697832dea0daf0cd81e4d0e8107cbe8a7e299f` | jpeg | unknown |
| jpg/orientation/portrait_3.jpg | 135813 | `ca9fb9a159320e6209d53a579b04be323095797b8bfc8ab5110ec8c38ecf9818` | jpeg | unknown |
| jpg/orientation/portrait_4.jpg | 131520 | `50fc16ad1174fc6eddd002ecd8baa310132c56fd8f732096889e105d718fac1a` | jpeg | unknown |
| jpg/orientation/portrait_5.jpg | 133715 | `dfbdfaf8a72e4fde8686c08df6cfe332864635affd0a9fb6e06cb106094b302e` | jpeg | unknown |
| jpg/orientation/portrait_6.jpg | 136257 | `323ce0d7140be76cbe6511e268766241dfe74eddf34b73f27f4637e552c8d824` | jpeg | unknown |
| jpg/orientation/portrait_7.jpg | 135366 | `792794408dc57227adb341a75a5766e36904a7ec0e640d6cca2d8b14fe25c141` | jpeg | unknown |
| jpg/orientation/portrait_8.jpg | 132543 | `2691666c64b68d563f50226c2df921c9edee827abf402e922be4be2e992fb061` | jpeg | unknown |
| jpg/tests/11-tests.jpg | 236569 | `2a41ccc348800707d7c19ce0e3457f5d4295486f29bf0a73f8cbe4bcf272136e` | jpeg | Canon |
| jpg/tests/22-canon_tags.jpg | 448492 | `494458d1d90e7d2b7c1aefe362cbf167ecdca1f3477f0bd2c801503a1d537b14` | jpeg | Canon |
| jpg/tests/28-hex_value.jpg | 1350507 | `2a08dd2931cb224f9b4864a4699cdd5093ed334faf68c9d2ef1e832855b219ae` | jpeg | Canon |
| jpg/tests/30-type_error.jpg | 300825 | `f2c156654b78e8a1f84a4d60932a15e76d3e106c7e51bd968fe2f5eda4d33f4d` | jpeg | unknown |
| jpg/tests/32-lens_data.jpeg | 36731 | `f0096a6d5c24dbe270525f7dc575e26ea28df63824055e7ad3253e2cf0d1dab0` | jpeg | NIKON CORPORATION |
| jpg/tests/33-type_error.jpg | 178028 | `16713b68edda8862069993045bfdba03f1c63c5f05857955f5a98c2c82ca5598` | jpeg | Canon |
| jpg/tests/35-empty.jpg | 1010466 | `44f1819124a7f7dba6552f629372649441f8ab24e4e7f4c1ebe5091d582220c8` | jpeg | CASIO COMPUTER CO.,LTD |
| jpg/tests/36-memory_error.jpg | 865978 | `3b0d73976a304eb0fe99048b066e19e6006b35cb620737af4c8915acedf98b16` | jpeg | CASIO COMPUTER CO.,LTD. |
| jpg/tests/42_IndexError.jpg | 2913134 | `d64e7c04839af125647d5a7500eb3b3e1b5c1ef81698a60e8b48b272f9ca5090` | jpeg | OLYMPUS IMAGING CORP. |
| jpg/tests/45-gps_ifd.jpg | 230349 | `0a986ea141d5f8f8b7588d6217e9a2d12140a76ec36cb0a022710c3e9fdfc921` | jpeg | Polyphony Digital Inc. |
| jpg/tests/46_UnicodeEncodeError.jpg | 10514729 | `3cf5ec5d6337fb31c90aa081654137c8e936b828809a2f3a91d2406188220090` | jpeg | Canon |
| jpg/tests/67-0_length_string.jpg | 162716 | `d45980d197658e88f7a4452b379fc3e9b2feb37f1b271ad7e5ce8560da8c2b10` | jpeg | samsung |
| jpg/tests/87_OSError.jpg | 889829 | `1f2b247e1ab6c26a41f670a7653404eda7eb198e923d71cafea04a0a934380e6` | jpeg | NIKON CORPORATION |
| jpg/tests/Xiaomi_Mi_9T_KeyError.jpg | 4137722 | `cf0be8f4b96d3792e27ff54b4efddb20a5b063ed54925c501d32977fb5c2aba7` | jpeg | Xiaomi |
| jpg/tests/nikon_D3100_TypeError.jpg | 22150 | `cd2de0459c0bdf5fada567b7beb5937a0bbfd3964d1122889bd8211f443a4267` | jpeg | NIKON CORPORATION |
| jpg/xmp/BlueSquare.jpg | 24205 | `1e1cdf92904b5da35302c2655e5f7a2ea68d6bf8d9b3922225e3f2a17ba3bb6b` | jpeg | unknown |
| jpg/xmp/no_exif.jpg | 182252 | `8e8c4a3233e1293fbe46933bdf38c85fdbcd070b8f5daa4f8b4342371d1d9673` | jpeg | unknown |
| tiff/Arbitro.tiff | 6925 | `26f4b11c45ad3e56a530d03967ff4627892b3264183b85fefba194ff1fe3e08e` | tiff | unknown |
| tiff/BSG1.tiff | 288538 | `f6e07811917470456d85bbe0d2c00f11fe57ea212afc33432e4457dfca6bd2a5` | tiff | unknown |
| tiff/Crémieux11.tiff | 10944 | `bda84c06634c1dd5f79c324829c485ee39dd24bf6d91e7fd81986cd0520eea18` | tiff | unknown |
| tiff/DudleyLeavittUtah.tiff | 91504 | `eabf6e832781b0c0130b8e0cb2533877ed11118bb08b7cdfe8939afe9997acc6` | tiff | unknown |
| tiff/Jobagent.tiff | 13068 | `8038925348ca9606995c95438d50630982069063b7c428b126a3282a01f246cd` | tiff | unknown |
| tiff/Picoawards.tiff | 15512 | `50dda7bf3c42e6c3979e25d6fec05d01e424274c8f28c4c9a911966d4faeb33e` | tiff | unknown |
| tiff/Rudless.tiff | 74954 | `be28b5a40ad84fbeb9a2fa8fb34fe16cd22560ff7d0cf70cfad3da8183d02b21` | tiff | unknown |
| tiff/Tless0.tiff | 21994 | `32f6aab90dc2d284a83040debe379e01333107b83a98c1aa2e6dabf56790b48a` | tiff | unknown |
