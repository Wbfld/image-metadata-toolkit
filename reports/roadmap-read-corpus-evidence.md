# External corpus differential report

- Schema: `browser-image-metadata.external-report.v2`
- Fixtures examined: 1227 (minimum 1000)
- Unique fixture hashes: 1121 (minimum 1000)
- Corpus: multiple pinned external corpora @ `multiple pinned revisions`
- Corpus source: **ianare-exif-py** — ianare/exif-py @ `a69bf74770caf6b333221658f5092ed69f99faac`; 108 fixtures; license/provenance: tests/resources README and attribution records at the pinned commit
- Corpus source: **imazen-codec-corpus** — imazen/codec-corpus @ `8e10d4d765667c1c49d74413878fc4bfb46dcf8d`; 1119 fixtures; license/provenance: README.md, LICENSE, and selected dataset README/LICENSE files at the pinned commit
- Total fixture bytes: 209997675
- Package: browser-image-metadata 2.0.0-alpha.3
- Reference: ExifTool via exiftool-vendored; package 38.1.0; ExifTool 13.59
- Registry: 1 / `3ad6c7db827e6086175d713c57bec7fe67885501aebbc4f00036c6ca75c54f23`
- Allowlist: 1 entries, `bc0d4cda193d4652b32625d3a78e379e90f2607fe933357865cab17617ecb82d`
- Normalization: browser-image-metadata.external-normalization.v1 / `042477dd007ba7862b86b6eef122d38f8a14c3e5357061e33fedd3df86ba2e0c`
- Gate: **PASS**
- Missing-local rate: 1.41% (maximum 5.00%)
- Mismatches: 0 (maximum 0)
- Comparable values: 9593 (minimum 100)
- Semantic agreement: 100.00% (minimum 99.00%)
- Non-comparable values: 63

## Totals

| found | matched | normalized-match | mismatched | missing-local | missing-reference | non-comparable |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 11502 | 6967 | 2626 | 0 | 137 | 1846 | 63 |

## Per-field results

| field | family | found | matched | normalized | mismatched | missing local | missing reference | non-comparable |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| block:EXIF | EXIF | 356 | 351 | 0 | 0 | 0 | 2 | 3 |
| block:ICC | ICC | 150 | 53 | 0 | 0 | 0 | 96 | 1 |
| block:IPTC | IPTC | 32 | 15 | 0 | 0 | 0 | 17 | 0 |
| block:JFIF | JFIF | 201 | 200 | 0 | 0 | 0 | 1 | 0 |
| block:XMP | XMP | 86 | 85 | 0 | 0 | 0 | 0 | 1 |
| DIMENSIONS:height | DIMENSIONS | 1119 | 552 | 0 | 0 | 27 | 567 | 0 |
| DIMENSIONS:width | DIMENSIONS | 1119 | 552 | 0 | 0 | 27 | 567 | 0 |
| EXIF:Acceleration | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| EXIF:ApertureValue | EXIF | 64 | 0 | 63 | 0 | 0 | 0 | 1 |
| EXIF:Artist | EXIF | 15 | 10 | 0 | 0 | 0 | 5 | 0 |
| EXIF:BitsPerSample | EXIF | 168 | 71 | 97 | 0 | 0 | 0 | 0 |
| EXIF:BodySerialNumber | EXIF | 4 | 2 | 2 | 0 | 0 | 0 | 0 |
| EXIF:BrightnessValue | EXIF | 37 | 0 | 37 | 0 | 0 | 0 | 0 |
| EXIF:CameraElevationAngle | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| EXIF:CameraFirmware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EXIF:CameraOwnerName | EXIF | 3 | 0 | 0 | 0 | 0 | 3 | 0 |
| EXIF:CFAPattern | EXIF | 5 | 0 | 5 | 0 | 0 | 0 | 0 |
| EXIF:ChromaticAberrationCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EXIF:ColorSpace | EXIF | 126 | 126 | 0 | 0 | 2 | 0 | 0 |
| EXIF:ComponentsConfiguration | EXIF | 99 | 98 | 1 | 0 | 1 | 0 | 0 |
| EXIF:CompositeImage | EXIF | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| EXIF:CompressedBitsPerPixel | EXIF | 57 | 0 | 56 | 0 | 0 | 1 | 0 |
| EXIF:Compression | EXIF | 266 | 266 | 0 | 0 | 1 | 0 | 0 |
| EXIF:Contrast | EXIF | 55 | 55 | 0 | 0 | 3 | 0 | 0 |
| EXIF:Copyright | EXIF | 35 | 24 | 11 | 0 | 0 | 0 | 0 |
| EXIF:CustomRendered | EXIF | 77 | 77 | 0 | 0 | 5 | 0 | 0 |
| EXIF:DateTime | EXIF | 142 | 1 | 141 | 0 | 1 | 0 | 0 |
| EXIF:DateTimeDigitized | EXIF | 121 | 1 | 120 | 0 | 1 | 0 | 0 |
| EXIF:DateTimeOriginal | EXIF | 129 | 1 | 128 | 0 | 3 | 0 | 0 |
| EXIF:DevelopmentType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EXIF:DevelopmentTypeDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EXIF:DeviceSettingDescription | EXIF | 1 | 0 | 0 | 0 | 0 | 0 | 1 |
| EXIF:DigitalZoomRatio | EXIF | 68 | 0 | 67 | 0 | 2 | 1 | 0 |
| EXIF:DistortionCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EXIF:ExifIFDPointer | EXIF | 180 | 0 | 0 | 0 | 0 | 180 | 0 |
| EXIF:ExifVersion | EXIF | 133 | 1 | 132 | 0 | 2 | 0 | 0 |
| EXIF:ExposureBiasValue | EXIF | 106 | 0 | 106 | 0 | 1 | 0 | 0 |
| EXIF:ExposureIndex | EXIF | 6 | 0 | 5 | 0 | 0 | 1 | 0 |
| EXIF:ExposureMode | EXIF | 92 | 92 | 0 | 0 | 4 | 0 | 0 |
| EXIF:ExposureProgram | EXIF | 97 | 97 | 0 | 0 | 1 | 0 | 0 |
| EXIF:ExposureTime | EXIF | 113 | 0 | 113 | 0 | 1 | 0 | 0 |
| EXIF:FileSource | EXIF | 69 | 69 | 0 | 0 | 1 | 0 | 0 |
| EXIF:Flash | EXIF | 120 | 120 | 0 | 0 | 1 | 0 | 0 |
| EXIF:FlashEnergy | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| EXIF:FlashpixVersion | EXIF | 104 | 1 | 102 | 0 | 2 | 1 | 0 |
| EXIF:FNumber | EXIF | 117 | 0 | 117 | 0 | 1 | 0 | 0 |
| EXIF:FocalLength | EXIF | 116 | 0 | 116 | 0 | 1 | 0 | 0 |
| EXIF:FocalLengthIn35mmFilm | EXIF | 62 | 62 | 0 | 0 | 0 | 0 | 0 |
| EXIF:FocalPlaneResolutionUnit | EXIF | 22 | 22 | 0 | 0 | 0 | 0 | 0 |
| EXIF:FocalPlaneXResolution | EXIF | 22 | 0 | 22 | 0 | 0 | 0 | 0 |
| EXIF:FocalPlaneYResolution | EXIF | 22 | 0 | 22 | 0 | 0 | 0 | 0 |
| EXIF:GainControl | EXIF | 39 | 38 | 1 | 0 | 1 | 0 | 0 |
| EXIF:Gamma | EXIF | 1 | 0 | 1 | 0 | 1 | 0 | 0 |
| EXIF:GPSAltitude | EXIF | 25 | 0 | 25 | 0 | 0 | 0 | 0 |
| EXIF:GPSAltitudeRef | EXIF | 33 | 33 | 0 | 0 | 0 | 0 | 0 |
| EXIF:GPSAreaInformation | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| EXIF:GPSDateStamp | EXIF | 35 | 0 | 35 | 0 | 0 | 0 | 0 |
| EXIF:GPSDestBearing | EXIF | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| EXIF:GPSDestBearingRef | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| EXIF:GPSDestDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EXIF:GPSDestDistanceRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EXIF:GPSDestLatitude | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| EXIF:GPSDestLatitudeRef | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| EXIF:GPSDestLongitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EXIF:GPSDestLongitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EXIF:GPSDifferential | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| EXIF:GPSDOP | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| EXIF:GPSHPositioningError | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| EXIF:GPSImgDirection | EXIF | 24 | 0 | 24 | 0 | 0 | 0 | 0 |
| EXIF:GPSImgDirectionRef | EXIF | 33 | 33 | 0 | 0 | 0 | 0 | 0 |
| EXIF:GPSInfoIFDPointer | EXIF | 48 | 0 | 0 | 0 | 0 | 48 | 0 |
| EXIF:GPSLatitude | EXIF | 39 | 37 | 1 | 0 | 0 | 1 | 0 |
| EXIF:GPSLatitudeRef | EXIF | 39 | 39 | 0 | 0 | 0 | 0 | 0 |
| EXIF:GPSLongitude | EXIF | 39 | 37 | 1 | 0 | 0 | 1 | 0 |
| EXIF:GPSLongitudeRef | EXIF | 39 | 39 | 0 | 0 | 0 | 0 | 0 |
| EXIF:GPSMapDatum | EXIF | 10 | 10 | 0 | 0 | 0 | 0 | 0 |
| EXIF:GPSMeasureMode | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EXIF:GPSProcessingMethod | EXIF | 4 | 2 | 2 | 0 | 0 | 0 | 0 |
| EXIF:GPSSatellites | EXIF | 9 | 9 | 0 | 0 | 0 | 0 | 0 |
| EXIF:GPSSpeed | EXIF | 7 | 0 | 7 | 0 | 0 | 0 | 0 |
| EXIF:GPSSpeedRef | EXIF | 7 | 7 | 0 | 0 | 0 | 0 | 0 |
| EXIF:GPSStatus | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EXIF:GPSTimeStamp | EXIF | 35 | 0 | 35 | 0 | 0 | 0 | 0 |
| EXIF:GPSTrack | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EXIF:GPSTrackRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EXIF:GPSVersionID | EXIF | 12 | 12 | 0 | 0 | 0 | 0 | 0 |
| EXIF:Humidity | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| EXIF:ImageDescription | EXIF | 69 | 69 | 0 | 0 | 0 | 0 | 0 |
| EXIF:ImageEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EXIF:ImageEditor | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EXIF:ImageLength | EXIF | 178 | 178 | 0 | 0 | 0 | 0 | 0 |
| EXIF:ImageTitle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EXIF:ImageUniqueID | EXIF | 11 | 10 | 1 | 0 | 0 | 0 | 0 |
| EXIF:ImageWidth | EXIF | 178 | 178 | 0 | 0 | 0 | 0 | 0 |
| EXIF:InteroperabilityIFDPointer | EXIF | 75 | 0 | 0 | 0 | 0 | 75 | 0 |
| EXIF:InteroperabilityIndex | EXIF | 75 | 0 | 0 | 0 | 0 | 75 | 0 |
| EXIF:InteroperabilityVersion | EXIF | 75 | 0 | 0 | 0 | 0 | 75 | 0 |
| EXIF:ISOSpeed | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| EXIF:ISOSpeedLatitudeyyy | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| EXIF:ISOSpeedLatitudezzz | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| EXIF:ISOSpeedRatings | EXIF | 105 | 103 | 2 | 0 | 1 | 0 | 0 |
| EXIF:JPEGInterchangeFormat | EXIF | 109 | 107 | 0 | 0 | 1 | 2 | 0 |
| EXIF:JPEGInterchangeFormatLength | EXIF | 109 | 107 | 0 | 0 | 1 | 2 | 0 |
| EXIF:LearningOptOutIn | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EXIF:LensMake | EXIF | 18 | 18 | 0 | 0 | 0 | 0 | 0 |
| EXIF:LensModel | EXIF | 22 | 22 | 0 | 0 | 0 | 0 | 0 |
| EXIF:LensSerialNumber | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| EXIF:LensSpecification | EXIF | 9 | 0 | 0 | 0 | 0 | 9 | 0 |
| EXIF:LightSource | EXIF | 65 | 65 | 0 | 0 | 1 | 0 | 0 |
| EXIF:Make | EXIF | 123 | 109 | 14 | 0 | 0 | 0 | 0 |
| EXIF:MakerNote | EXIF | 76 | 0 | 0 | 0 | 0 | 76 | 0 |
| EXIF:MaxApertureValue | EXIF | 97 | 0 | 96 | 0 | 1 | 0 | 1 |
| EXIF:MetadataEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EXIF:MeteringMode | EXIF | 111 | 111 | 0 | 0 | 1 | 0 | 0 |
| EXIF:Model | EXIF | 123 | 100 | 23 | 0 | 0 | 0 | 0 |
| EXIF:NoiseReduction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EXIF:OECF | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| EXIF:OffsetTime | EXIF | 27 | 27 | 0 | 0 | 0 | 0 | 0 |
| EXIF:OffsetTimeDigitized | EXIF | 15 | 15 | 0 | 0 | 0 | 0 | 0 |
| EXIF:OffsetTimeOriginal | EXIF | 8 | 8 | 0 | 0 | 0 | 0 | 0 |
| EXIF:Orientation | EXIF | 240 | 240 | 0 | 0 | 2 | 0 | 0 |
| EXIF:Photographer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EXIF:PhotometricInterpretation | EXIF | 166 | 166 | 0 | 0 | 0 | 0 | 0 |
| EXIF:PixelXDimension | EXIF | 138 | 137 | 1 | 0 | 0 | 0 | 0 |
| EXIF:PixelYDimension | EXIF | 138 | 137 | 1 | 0 | 0 | 0 | 0 |
| EXIF:PlanarConfiguration | EXIF | 143 | 143 | 0 | 0 | 0 | 0 | 0 |
| EXIF:Pressure | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| EXIF:PrimaryChromaticities | EXIF | 16 | 0 | 16 | 0 | 0 | 0 | 0 |
| EXIF:RAWDevelopingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EXIF:RecommendedExposureIndex | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| EXIF:ReferenceBlackWhite | EXIF | 9 | 0 | 9 | 0 | 0 | 0 | 0 |
| EXIF:RelatedImageFileFormat | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EXIF:RelatedImageLength | EXIF | 8 | 0 | 0 | 0 | 0 | 8 | 0 |
| EXIF:RelatedImageWidth | EXIF | 8 | 8 | 0 | 0 | 1 | 0 | 0 |
| EXIF:RelatedSoundFile | EXIF | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| EXIF:ResolutionUnit | EXIF | 254 | 254 | 0 | 0 | 3 | 0 | 0 |
| EXIF:RowsPerStrip | EXIF | 149 | 149 | 0 | 0 | 0 | 0 | 0 |
| EXIF:SamplesPerPixel | EXIF | 165 | 165 | 0 | 0 | 0 | 0 | 0 |
| EXIF:Saturation | EXIF | 57 | 57 | 0 | 0 | 3 | 0 | 0 |
| EXIF:SceneCaptureType | EXIF | 90 | 90 | 0 | 0 | 4 | 0 | 0 |
| EXIF:SceneType | EXIF | 74 | 74 | 0 | 0 | 1 | 0 | 0 |
| EXIF:SensingMethod | EXIF | 53 | 53 | 0 | 0 | 0 | 0 | 0 |
| EXIF:SensitivityType | EXIF | 15 | 15 | 0 | 0 | 0 | 0 | 0 |
| EXIF:ShadingCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EXIF:Sharpness | EXIF | 61 | 61 | 0 | 0 | 3 | 0 | 0 |
| EXIF:ShutterSpeedValue | EXIF | 62 | 0 | 61 | 0 | 0 | 0 | 1 |
| EXIF:Software | EXIF | 185 | 175 | 10 | 0 | 1 | 0 | 0 |
| EXIF:SourceExposureTimesOfCompositeImage | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| EXIF:SourceImageNumberOfCompositeImage | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| EXIF:SpatialFrequencyResponse | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| EXIF:SpectralSensitivity | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| EXIF:StandardOutputSensitivity | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| EXIF:StripByteCounts | EXIF | 152 | 83 | 40 | 0 | 0 | 2 | 27 |
| EXIF:StripOffsets | EXIF | 152 | 83 | 40 | 0 | 0 | 2 | 27 |
| EXIF:SubjectArea | EXIF | 8 | 0 | 8 | 0 | 0 | 0 | 0 |
| EXIF:SubjectDistance | EXIF | 19 | 0 | 18 | 0 | 0 | 1 | 0 |
| EXIF:SubjectDistanceRange | EXIF | 45 | 45 | 0 | 0 | 2 | 0 | 0 |
| EXIF:SubjectLocation | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| EXIF:SubSecTime | EXIF | 20 | 9 | 11 | 0 | 0 | 0 | 0 |
| EXIF:SubSecTimeDigitized | EXIF | 22 | 11 | 11 | 0 | 0 | 0 | 0 |
| EXIF:SubSecTimeOriginal | EXIF | 32 | 11 | 21 | 0 | 1 | 0 | 0 |
| EXIF:Temperature | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| EXIF:TransferFunction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EXIF:UserComment | EXIF | 50 | 0 | 32 | 0 | 2 | 18 | 0 |
| EXIF:WaterDepth | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| EXIF:WhiteBalance | EXIF | 97 | 97 | 0 | 0 | 4 | 0 | 0 |
| EXIF:WhitePoint | EXIF | 16 | 0 | 16 | 0 | 0 | 0 | 0 |
| EXIF:XResolution | EXIF | 258 | 1 | 257 | 0 | 3 | 0 | 0 |
| EXIF:YCbCrCoefficients | EXIF | 6 | 0 | 6 | 0 | 0 | 0 | 0 |
| EXIF:YCbCrPositioning | EXIF | 110 | 110 | 0 | 0 | 2 | 0 | 0 |
| EXIF:YCbCrSubSampling | EXIF | 12 | 0 | 12 | 0 | 0 | 0 | 0 |
| EXIF:YResolution | EXIF | 258 | 1 | 257 | 0 | 3 | 0 | 0 |
| IPTC:Byline | IPTC | 5 | 0 | 0 | 0 | 0 | 5 | 0 |
| IPTC:Caption | IPTC | 7 | 7 | 0 | 0 | 0 | 0 | 0 |
| IPTC:City | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| IPTC:CopyrightNotice | IPTC | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| IPTC:CountryCode | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| IPTC:DateCreated | IPTC | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| IPTC:Headline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| IPTC:Keywords | IPTC | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| IPTC:ObjectName | IPTC | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| XMP:XMP-dc:Creator | XMP | 8 | 8 | 0 | 0 | 0 | 0 | 0 |
| XMP:XMP-dc:Description | XMP | 6 | 5 | 1 | 0 | 0 | 0 | 0 |
| XMP:XMP-dc:Title | XMP | 6 | 6 | 0 | 0 | 0 | 0 | 0 |
| XMP:XMP-xmp:CreateDate | XMP | 46 | 0 | 46 | 0 | 6 | 0 | 0 |

## Per-producer results

| producer | found | matched | normalized | mismatched | missing local | missing reference | non-comparable |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Apple | 311 | 175 | 116 | 0 | 0 | 20 | 0 |
| Canon | 737 | 403 | 248 | 0 | 7 | 86 | 0 |
| Caplio | 78 | 44 | 26 | 0 | 0 | 8 | 0 |
| CASIO COMPUTER CO.,LTD | 50 | 29 | 15 | 0 | 0 | 6 | 0 |
| CASIO COMPUTER CO.,LTD. | 49 | 28 | 16 | 0 | 0 | 5 | 0 |
| E75046D8U111299 | 26 | 16 | 5 | 0 | 0 | 5 | 0 |
| Eastman Kodak Company | 39 | 22 | 13 | 0 | 0 | 4 | 0 |
| EASTMAN KODAK COMPANY | 101 | 58 | 33 | 0 | 0 | 10 | 0 |
| Fairphone | 60 | 34 | 23 | 0 | 0 | 3 | 0 |
| Flip | 9 | 5 | 2 | 0 | 0 | 2 | 0 |
| FUJIFILM | 339 | 175 | 131 | 0 | 0 | 31 | 2 |
| Google | 798 | 481 | 279 | 0 | 0 | 38 | 0 |
| HMD Global | 62 | 42 | 16 | 0 | 0 | 4 | 0 |
| Jolla | 26 | 13 | 12 | 0 | 0 | 1 | 0 |
| KONICA MINOLTA | 108 | 64 | 32 | 0 | 0 | 12 | 0 |
| NIKON | 1125 | 719 | 301 | 0 | 0 | 105 | 0 |
| NIKON CORPORATION | 328 | 206 | 102 | 0 | 2 | 20 | 0 |
| Nokia | 139 | 89 | 43 | 0 | 0 | 7 | 0 |
| OLYMPUS CORPORATION | 106 | 64 | 32 | 0 | 0 | 10 | 0 |
| OLYMPUS IMAGING CORP. | 174 | 98 | 55 | 0 | 27 | 19 | 2 |
| OLYMPUS OPTICAL CO.,LTD | 43 | 24 | 14 | 0 | 0 | 5 | 0 |
| Panasonic | 162 | 104 | 43 | 0 | 0 | 15 | 0 |
| PENTAX Corporation | 74 | 44 | 28 | 0 | 16 | 2 | 0 |
| Polyphony Digital Inc. | 36 | 20 | 10 | 0 | 0 | 6 | 0 |
| RICOH | 38 | 16 | 16 | 0 | 0 | 6 | 0 |
| samsung | 223 | 140 | 62 | 0 | 0 | 21 | 0 |
| Samsung | 59 | 33 | 22 | 0 | 0 | 4 | 0 |
| Samsung Techwin | 112 | 68 | 34 | 0 | 0 | 10 | 0 |
| SANYO Electric Co.,Ltd. | 78 | 42 | 29 | 0 | 0 | 7 | 0 |
| SONY | 514 | 318 | 147 | 0 | 1 | 49 | 0 |
| SONY ERICSSON | 26 | 15 | 7 | 0 | 0 | 4 | 0 |
| unknown | 5380 | 3328 | 681 | 0 | 84 | 1312 | 59 |
| WWL | 41 | 22 | 15 | 0 | 0 | 4 | 0 |
| Xiaomi | 51 | 28 | 18 | 0 | 0 | 5 | 0 |

## Per-producer field results

| producer | field | family | found | matched | normalized | mismatched | missing local | missing reference | non-comparable |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Apple | block:EXIF | EXIF | 6 | 6 | 0 | 0 | 0 | 0 | 0 |
| Apple | block:ICC | ICC | 3 | 2 | 0 | 0 | 0 | 1 | 0 |
| Apple | block:IPTC | IPTC | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Apple | block:JFIF | JFIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Apple | block:XMP | XMP | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Apple | DIMENSIONS:height | DIMENSIONS | 6 | 6 | 0 | 0 | 0 | 0 | 0 |
| Apple | DIMENSIONS:width | DIMENSIONS | 6 | 6 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:Acceleration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:ApertureValue | EXIF | 5 | 0 | 5 | 0 | 0 | 0 | 0 |
| Apple | EXIF:Artist | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:BitsPerSample | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:BodySerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:BrightnessValue | EXIF | 5 | 0 | 5 | 0 | 0 | 0 | 0 |
| Apple | EXIF:CameraElevationAngle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:CameraFirmware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:CameraOwnerName | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:CFAPattern | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:ChromaticAberrationCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:ColorSpace | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:ComponentsConfiguration | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:CompositeImage | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:CompressedBitsPerPixel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:Compression | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:Contrast | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:Copyright | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:CustomRendered | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:DateTime | EXIF | 5 | 0 | 5 | 0 | 0 | 0 | 0 |
| Apple | EXIF:DateTimeDigitized | EXIF | 5 | 0 | 5 | 0 | 0 | 0 | 0 |
| Apple | EXIF:DateTimeOriginal | EXIF | 6 | 0 | 6 | 0 | 0 | 0 | 0 |
| Apple | EXIF:DevelopmentType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:DevelopmentTypeDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:DeviceSettingDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:DigitalZoomRatio | EXIF | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| Apple | EXIF:DistortionCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:ExifIFDPointer | EXIF | 6 | 0 | 0 | 0 | 0 | 6 | 0 |
| Apple | EXIF:ExifVersion | EXIF | 5 | 0 | 5 | 0 | 0 | 0 | 0 |
| Apple | EXIF:ExposureBiasValue | EXIF | 5 | 0 | 5 | 0 | 0 | 0 | 0 |
| Apple | EXIF:ExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:ExposureMode | EXIF | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:ExposureProgram | EXIF | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:ExposureTime | EXIF | 5 | 0 | 5 | 0 | 0 | 0 | 0 |
| Apple | EXIF:FileSource | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:Flash | EXIF | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:FlashEnergy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:FlashpixVersion | EXIF | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| Apple | EXIF:FNumber | EXIF | 5 | 0 | 5 | 0 | 0 | 0 | 0 |
| Apple | EXIF:FocalLength | EXIF | 5 | 0 | 5 | 0 | 0 | 0 | 0 |
| Apple | EXIF:FocalLengthIn35mmFilm | EXIF | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:FocalPlaneResolutionUnit | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:FocalPlaneXResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:FocalPlaneYResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:GainControl | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:Gamma | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:GPSAltitude | EXIF | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| Apple | EXIF:GPSAltitudeRef | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:GPSAreaInformation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:GPSDateStamp | EXIF | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| Apple | EXIF:GPSDestBearing | EXIF | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| Apple | EXIF:GPSDestBearingRef | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:GPSDestDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:GPSDestDistanceRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:GPSDestLatitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:GPSDestLatitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:GPSDestLongitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:GPSDestLongitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:GPSDifferential | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:GPSDOP | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:GPSHPositioningError | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Apple | EXIF:GPSImgDirection | EXIF | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| Apple | EXIF:GPSImgDirectionRef | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:GPSInfoIFDPointer | EXIF | 4 | 0 | 0 | 0 | 0 | 4 | 0 |
| Apple | EXIF:GPSLatitude | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:GPSLatitudeRef | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:GPSLongitude | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:GPSLongitudeRef | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:GPSMapDatum | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:GPSMeasureMode | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:GPSProcessingMethod | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:GPSSatellites | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:GPSSpeed | EXIF | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| Apple | EXIF:GPSSpeedRef | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:GPSStatus | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:GPSTimeStamp | EXIF | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
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
| Apple | EXIF:ISOSpeedRatings | EXIF | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:JPEGInterchangeFormat | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:JPEGInterchangeFormatLength | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:LearningOptOutIn | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:LensMake | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:LensModel | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:LensSerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:LensSpecification | EXIF | 4 | 0 | 0 | 0 | 0 | 4 | 0 |
| Apple | EXIF:LightSource | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:Make | EXIF | 6 | 6 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:MakerNote | EXIF | 5 | 0 | 0 | 0 | 0 | 5 | 0 |
| Apple | EXIF:MaxApertureValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:MetadataEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:MeteringMode | EXIF | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:Model | EXIF | 6 | 6 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:NoiseReduction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:OECF | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:OffsetTime | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:OffsetTimeDigitized | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:OffsetTimeOriginal | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:Orientation | EXIF | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:Photographer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:PhotometricInterpretation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:PixelXDimension | EXIF | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:PixelYDimension | EXIF | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
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
| Apple | EXIF:ResolutionUnit | EXIF | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:RowsPerStrip | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:SamplesPerPixel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:Saturation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:SceneCaptureType | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:SceneType | EXIF | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:SensingMethod | EXIF | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:SensitivityType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:ShadingCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:Sharpness | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:ShutterSpeedValue | EXIF | 5 | 0 | 5 | 0 | 0 | 0 | 0 |
| Apple | EXIF:Software | EXIF | 5 | 3 | 2 | 0 | 0 | 0 | 0 |
| Apple | EXIF:SourceExposureTimesOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:SourceImageNumberOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:SpatialFrequencyResponse | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:SpectralSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:StandardOutputSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:StripByteCounts | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:StripOffsets | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:SubjectArea | EXIF | 5 | 0 | 5 | 0 | 0 | 0 | 0 |
| Apple | EXIF:SubjectDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:SubjectDistanceRange | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:SubjectLocation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:SubSecTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:SubSecTimeDigitized | EXIF | 5 | 1 | 4 | 0 | 0 | 0 | 0 |
| Apple | EXIF:SubSecTimeOriginal | EXIF | 6 | 1 | 5 | 0 | 0 | 0 | 0 |
| Apple | EXIF:Temperature | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:TransferFunction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:UserComment | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:WaterDepth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:WhiteBalance | EXIF | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:WhitePoint | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:XResolution | EXIF | 5 | 0 | 5 | 0 | 0 | 0 | 0 |
| Apple | EXIF:YCbCrCoefficients | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:YCbCrPositioning | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:YCbCrSubSampling | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | EXIF:YResolution | EXIF | 5 | 0 | 5 | 0 | 0 | 0 | 0 |
| Apple | IPTC:Byline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | IPTC:Caption | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | IPTC:City | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | IPTC:CopyrightNotice | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | IPTC:CountryCode | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | IPTC:DateCreated | IPTC | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Apple | IPTC:Headline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | IPTC:Keywords | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | IPTC:ObjectName | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | XMP:XMP-dc:Creator | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | XMP:XMP-dc:Description | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | XMP:XMP-dc:Title | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Apple | XMP:XMP-xmp:CreateDate | XMP | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Canon | block:EXIF | EXIF | 14 | 14 | 0 | 0 | 0 | 0 | 0 |
| Canon | block:ICC | ICC | 6 | 6 | 0 | 0 | 0 | 0 | 0 |
| Canon | block:IPTC | IPTC | 5 | 4 | 0 | 0 | 0 | 1 | 0 |
| Canon | block:JFIF | JFIF | 7 | 7 | 0 | 0 | 0 | 0 | 0 |
| Canon | block:XMP | XMP | 8 | 8 | 0 | 0 | 0 | 0 | 0 |
| Canon | DIMENSIONS:height | DIMENSIONS | 14 | 14 | 0 | 0 | 0 | 0 | 0 |
| Canon | DIMENSIONS:width | DIMENSIONS | 14 | 14 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:Acceleration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:ApertureValue | EXIF | 14 | 0 | 14 | 0 | 0 | 0 | 0 |
| Canon | EXIF:Artist | EXIF | 4 | 2 | 0 | 0 | 0 | 2 | 0 |
| Canon | EXIF:BitsPerSample | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:BodySerialNumber | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| Canon | EXIF:BrightnessValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:CameraElevationAngle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:CameraFirmware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:CameraOwnerName | EXIF | 2 | 0 | 0 | 0 | 0 | 2 | 0 |
| Canon | EXIF:CFAPattern | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:ChromaticAberrationCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:ColorSpace | EXIF | 13 | 13 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:ComponentsConfiguration | EXIF | 12 | 11 | 1 | 0 | 0 | 0 | 0 |
| Canon | EXIF:CompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:CompressedBitsPerPixel | EXIF | 10 | 0 | 10 | 0 | 0 | 0 | 0 |
| Canon | EXIF:Compression | EXIF | 13 | 13 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:Contrast | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:Copyright | EXIF | 4 | 3 | 1 | 0 | 0 | 0 | 0 |
| Canon | EXIF:CustomRendered | EXIF | 12 | 12 | 0 | 0 | 1 | 0 | 0 |
| Canon | EXIF:DateTime | EXIF | 14 | 0 | 14 | 0 | 0 | 0 | 0 |
| Canon | EXIF:DateTimeDigitized | EXIF | 14 | 0 | 14 | 0 | 0 | 0 | 0 |
| Canon | EXIF:DateTimeOriginal | EXIF | 14 | 0 | 14 | 0 | 0 | 0 | 0 |
| Canon | EXIF:DevelopmentType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:DevelopmentTypeDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:DeviceSettingDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:DigitalZoomRatio | EXIF | 7 | 0 | 7 | 0 | 1 | 0 | 0 |
| Canon | EXIF:DistortionCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:ExifIFDPointer | EXIF | 14 | 0 | 0 | 0 | 0 | 14 | 0 |
| Canon | EXIF:ExifVersion | EXIF | 14 | 1 | 13 | 0 | 0 | 0 | 0 |
| Canon | EXIF:ExposureBiasValue | EXIF | 14 | 0 | 14 | 0 | 0 | 0 | 0 |
| Canon | EXIF:ExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:ExposureMode | EXIF | 12 | 12 | 0 | 0 | 1 | 0 | 0 |
| Canon | EXIF:ExposureProgram | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:ExposureTime | EXIF | 14 | 0 | 14 | 0 | 0 | 0 | 0 |
| Canon | EXIF:FileSource | EXIF | 10 | 10 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:Flash | EXIF | 14 | 14 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:FlashEnergy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:FlashpixVersion | EXIF | 12 | 1 | 11 | 0 | 0 | 0 | 0 |
| Canon | EXIF:FNumber | EXIF | 14 | 0 | 14 | 0 | 0 | 0 | 0 |
| Canon | EXIF:FocalLength | EXIF | 14 | 0 | 14 | 0 | 0 | 0 | 0 |
| Canon | EXIF:FocalLengthIn35mmFilm | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:FocalPlaneResolutionUnit | EXIF | 14 | 14 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:FocalPlaneXResolution | EXIF | 14 | 0 | 14 | 0 | 0 | 0 | 0 |
| Canon | EXIF:FocalPlaneYResolution | EXIF | 14 | 0 | 14 | 0 | 0 | 0 | 0 |
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
| Canon | EXIF:GPSInfoIFDPointer | EXIF | 5 | 0 | 0 | 0 | 0 | 5 | 0 |
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
| Canon | EXIF:GPSVersionID | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:Humidity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:ImageDescription | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:ImageEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:ImageEditor | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:ImageLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:ImageTitle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:ImageUniqueID | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:ImageWidth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:InteroperabilityIFDPointer | EXIF | 10 | 0 | 0 | 0 | 0 | 10 | 0 |
| Canon | EXIF:InteroperabilityIndex | EXIF | 10 | 0 | 0 | 0 | 0 | 10 | 0 |
| Canon | EXIF:InteroperabilityVersion | EXIF | 10 | 0 | 0 | 0 | 0 | 10 | 0 |
| Canon | EXIF:ISOSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:ISOSpeedLatitudeyyy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:ISOSpeedLatitudezzz | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:ISOSpeedRatings | EXIF | 8 | 8 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:JPEGInterchangeFormat | EXIF | 13 | 13 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:JPEGInterchangeFormatLength | EXIF | 13 | 13 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:LearningOptOutIn | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:LensMake | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:LensModel | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:LensSerialNumber | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:LensSpecification | EXIF | 2 | 0 | 0 | 0 | 0 | 2 | 0 |
| Canon | EXIF:LightSource | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:Make | EXIF | 14 | 14 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:MakerNote | EXIF | 8 | 0 | 0 | 0 | 0 | 8 | 0 |
| Canon | EXIF:MaxApertureValue | EXIF | 12 | 0 | 12 | 0 | 0 | 0 | 0 |
| Canon | EXIF:MetadataEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:MeteringMode | EXIF | 14 | 14 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:Model | EXIF | 14 | 14 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:NoiseReduction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:OECF | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:OffsetTime | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:OffsetTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:OffsetTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:Orientation | EXIF | 10 | 10 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:Photographer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:PhotometricInterpretation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:PixelXDimension | EXIF | 12 | 12 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:PixelYDimension | EXIF | 12 | 12 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:PlanarConfiguration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:Pressure | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:PrimaryChromaticities | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:RAWDevelopingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:RecommendedExposureIndex | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:ReferenceBlackWhite | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:RelatedImageFileFormat | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:RelatedImageLength | EXIF | 7 | 0 | 0 | 0 | 0 | 7 | 0 |
| Canon | EXIF:RelatedImageWidth | EXIF | 7 | 7 | 0 | 0 | 1 | 0 | 0 |
| Canon | EXIF:RelatedSoundFile | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:ResolutionUnit | EXIF | 13 | 13 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:RowsPerStrip | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:SamplesPerPixel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:Saturation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:SceneCaptureType | EXIF | 12 | 12 | 0 | 0 | 1 | 0 | 0 |
| Canon | EXIF:SceneType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:SensingMethod | EXIF | 10 | 10 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:SensitivityType | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:ShadingCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:Sharpness | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:ShutterSpeedValue | EXIF | 14 | 0 | 14 | 0 | 0 | 0 | 0 |
| Canon | EXIF:Software | EXIF | 8 | 8 | 0 | 0 | 0 | 0 | 0 |
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
| Canon | EXIF:SubSecTime | EXIF | 3 | 2 | 1 | 0 | 0 | 0 | 0 |
| Canon | EXIF:SubSecTimeDigitized | EXIF | 5 | 3 | 2 | 0 | 0 | 0 | 0 |
| Canon | EXIF:SubSecTimeOriginal | EXIF | 5 | 3 | 2 | 0 | 0 | 0 | 0 |
| Canon | EXIF:Temperature | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:TransferFunction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:UserComment | EXIF | 11 | 0 | 0 | 0 | 0 | 11 | 0 |
| Canon | EXIF:WaterDepth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:WhiteBalance | EXIF | 12 | 12 | 0 | 0 | 1 | 0 | 0 |
| Canon | EXIF:WhitePoint | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:XResolution | EXIF | 13 | 0 | 13 | 0 | 0 | 0 | 0 |
| Canon | EXIF:YCbCrCoefficients | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:YCbCrPositioning | EXIF | 12 | 12 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:YCbCrSubSampling | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | EXIF:YResolution | EXIF | 13 | 0 | 13 | 0 | 0 | 0 | 0 |
| Canon | IPTC:Byline | IPTC | 2 | 0 | 0 | 0 | 0 | 2 | 0 |
| Canon | IPTC:Caption | IPTC | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Canon | IPTC:City | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | IPTC:CopyrightNotice | IPTC | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Canon | IPTC:CountryCode | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | IPTC:DateCreated | IPTC | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| Canon | IPTC:Headline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Canon | IPTC:Keywords | IPTC | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Canon | IPTC:ObjectName | IPTC | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Canon | XMP:XMP-dc:Creator | XMP | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Canon | XMP:XMP-dc:Description | XMP | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Canon | XMP:XMP-dc:Title | XMP | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Canon | XMP:XMP-xmp:CreateDate | XMP | 3 | 0 | 3 | 0 | 1 | 0 | 0 |
| Caplio | block:EXIF | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Caplio | block:ICC | ICC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | block:IPTC | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | block:JFIF | JFIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Caplio | block:XMP | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | DIMENSIONS:height | DIMENSIONS | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Caplio | DIMENSIONS:width | DIMENSIONS | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:Acceleration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:ApertureValue | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:Artist | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:BitsPerSample | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:BodySerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:BrightnessValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:CameraElevationAngle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:CameraFirmware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:CameraOwnerName | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:CFAPattern | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:ChromaticAberrationCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:ColorSpace | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:ComponentsConfiguration | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:CompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:CompressedBitsPerPixel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:Compression | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:Contrast | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:Copyright | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:CustomRendered | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:DateTime | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:DateTimeDigitized | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:DateTimeOriginal | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:DevelopmentType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:DevelopmentTypeDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:DeviceSettingDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:DigitalZoomRatio | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:DistortionCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:ExifIFDPointer | EXIF | 2 | 0 | 0 | 0 | 0 | 2 | 0 |
| Caplio | EXIF:ExifVersion | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:ExposureBiasValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:ExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:ExposureMode | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:ExposureProgram | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:ExposureTime | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:FileSource | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:Flash | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:FlashEnergy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:FlashpixVersion | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:FNumber | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
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
| Caplio | EXIF:ImageUniqueID | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:ImageWidth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:InteroperabilityIFDPointer | EXIF | 2 | 0 | 0 | 0 | 0 | 2 | 0 |
| Caplio | EXIF:InteroperabilityIndex | EXIF | 2 | 0 | 0 | 0 | 0 | 2 | 0 |
| Caplio | EXIF:InteroperabilityVersion | EXIF | 2 | 0 | 0 | 0 | 0 | 2 | 0 |
| Caplio | EXIF:ISOSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:ISOSpeedLatitudeyyy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:ISOSpeedLatitudezzz | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:ISOSpeedRatings | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:JPEGInterchangeFormat | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:JPEGInterchangeFormatLength | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:LearningOptOutIn | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:LensMake | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:LensModel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:LensSerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:LensSpecification | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:LightSource | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:Make | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:MakerNote | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:MaxApertureValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:MetadataEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:MeteringMode | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:Model | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:NoiseReduction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:OECF | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:OffsetTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:OffsetTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:OffsetTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:Orientation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:Photographer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:PhotometricInterpretation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:PixelXDimension | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:PixelYDimension | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
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
| Caplio | EXIF:ResolutionUnit | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:RowsPerStrip | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:SamplesPerPixel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:Saturation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:SceneCaptureType | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:SceneType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:SensingMethod | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:SensitivityType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:ShadingCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:Sharpness | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:ShutterSpeedValue | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:Software | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:SourceExposureTimesOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:SourceImageNumberOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:SpatialFrequencyResponse | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:SpectralSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:StandardOutputSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:StripByteCounts | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:StripOffsets | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:SubjectArea | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:SubjectDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:SubjectDistanceRange | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:SubjectLocation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:SubSecTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:SubSecTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:SubSecTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:Temperature | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:TransferFunction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:UserComment | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:WaterDepth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:WhiteBalance | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:WhitePoint | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:XResolution | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:YCbCrCoefficients | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:YCbCrPositioning | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:YCbCrSubSampling | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Caplio | EXIF:YResolution | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
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
| E75046D8U111299 | block:EXIF | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | block:ICC | ICC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | block:IPTC | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | block:JFIF | JFIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | block:XMP | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | DIMENSIONS:height | DIMENSIONS | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | DIMENSIONS:width | DIMENSIONS | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:Acceleration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:ApertureValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:Artist | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:BitsPerSample | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:BodySerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:BrightnessValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:CameraElevationAngle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:CameraFirmware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:CameraOwnerName | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:CFAPattern | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:ChromaticAberrationCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:ColorSpace | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:ComponentsConfiguration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:CompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:CompressedBitsPerPixel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:Compression | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:Contrast | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:Copyright | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:CustomRendered | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:DateTime | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:DateTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:DateTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:DevelopmentType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:DevelopmentTypeDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:DeviceSettingDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:DigitalZoomRatio | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:DistortionCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:ExifIFDPointer | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| E75046D8U111299 | EXIF:ExifVersion | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:ExposureBiasValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:ExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:ExposureMode | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:ExposureProgram | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:ExposureTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:FileSource | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:Flash | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:FlashEnergy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:FlashpixVersion | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:FNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:FocalLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:FocalLengthIn35mmFilm | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:FocalPlaneResolutionUnit | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:FocalPlaneXResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:FocalPlaneYResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:GainControl | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:Gamma | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:GPSAltitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:GPSAltitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:GPSAreaInformation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:GPSDateStamp | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:GPSDestBearing | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:GPSDestBearingRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:GPSDestDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:GPSDestDistanceRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:GPSDestLatitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:GPSDestLatitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:GPSDestLongitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:GPSDestLongitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:GPSDifferential | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:GPSDOP | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:GPSHPositioningError | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:GPSImgDirection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:GPSImgDirectionRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:GPSInfoIFDPointer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:GPSLatitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:GPSLatitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:GPSLongitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:GPSLongitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:GPSMapDatum | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:GPSMeasureMode | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:GPSProcessingMethod | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:GPSSatellites | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:GPSSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:GPSSpeedRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:GPSStatus | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:GPSTimeStamp | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:GPSTrack | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:GPSTrackRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:GPSVersionID | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:Humidity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:ImageDescription | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:ImageEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:ImageEditor | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:ImageLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:ImageTitle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:ImageUniqueID | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:ImageWidth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:InteroperabilityIFDPointer | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| E75046D8U111299 | EXIF:InteroperabilityIndex | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| E75046D8U111299 | EXIF:InteroperabilityVersion | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| E75046D8U111299 | EXIF:ISOSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:ISOSpeedLatitudeyyy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:ISOSpeedLatitudezzz | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:ISOSpeedRatings | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:JPEGInterchangeFormat | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:JPEGInterchangeFormatLength | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:LearningOptOutIn | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:LensMake | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:LensModel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:LensSerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:LensSpecification | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:LightSource | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:Make | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:MakerNote | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| E75046D8U111299 | EXIF:MaxApertureValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:MetadataEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:MeteringMode | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:Model | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:NoiseReduction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:OECF | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:OffsetTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:OffsetTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:OffsetTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:Orientation | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:Photographer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:PhotometricInterpretation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:PixelXDimension | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:PixelYDimension | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:PlanarConfiguration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:Pressure | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:PrimaryChromaticities | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:RAWDevelopingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:RecommendedExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:ReferenceBlackWhite | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:RelatedImageFileFormat | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:RelatedImageLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:RelatedImageWidth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:RelatedSoundFile | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:ResolutionUnit | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:RowsPerStrip | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:SamplesPerPixel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:Saturation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:SceneCaptureType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:SceneType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:SensingMethod | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:SensitivityType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:ShadingCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:Sharpness | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:ShutterSpeedValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:Software | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:SourceExposureTimesOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:SourceImageNumberOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:SpatialFrequencyResponse | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:SpectralSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:StandardOutputSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:StripByteCounts | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:StripOffsets | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:SubjectArea | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:SubjectDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:SubjectDistanceRange | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:SubjectLocation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:SubSecTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:SubSecTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:SubSecTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:Temperature | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:TransferFunction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:UserComment | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:WaterDepth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:WhiteBalance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:WhitePoint | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:XResolution | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:YCbCrCoefficients | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:YCbCrPositioning | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:YCbCrSubSampling | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | EXIF:YResolution | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | IPTC:Byline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | IPTC:Caption | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | IPTC:City | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | IPTC:CopyrightNotice | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | IPTC:CountryCode | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | IPTC:DateCreated | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | IPTC:Headline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | IPTC:Keywords | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | IPTC:ObjectName | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | XMP:XMP-dc:Creator | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | XMP:XMP-dc:Description | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | XMP:XMP-dc:Title | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| E75046D8U111299 | XMP:XMP-xmp:CreateDate | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
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
| Fairphone | block:EXIF | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | block:ICC | ICC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | block:IPTC | IPTC | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| Fairphone | block:JFIF | JFIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | block:XMP | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | DIMENSIONS:height | DIMENSIONS | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | DIMENSIONS:width | DIMENSIONS | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:Acceleration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:ApertureValue | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:Artist | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:BitsPerSample | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:BodySerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:BrightnessValue | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:CameraElevationAngle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:CameraFirmware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:CameraOwnerName | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:CFAPattern | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:ChromaticAberrationCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:ColorSpace | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:ComponentsConfiguration | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:CompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:CompressedBitsPerPixel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:Compression | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:Contrast | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:Copyright | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:CustomRendered | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:DateTime | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:DateTimeDigitized | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:DateTimeOriginal | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:DevelopmentType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:DevelopmentTypeDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:DeviceSettingDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:DigitalZoomRatio | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:DistortionCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:ExifIFDPointer | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| Fairphone | EXIF:ExifVersion | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:ExposureBiasValue | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:ExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:ExposureMode | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:ExposureProgram | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:ExposureTime | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:FileSource | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:Flash | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:FlashEnergy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:FlashpixVersion | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:FNumber | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:FocalLength | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:FocalLengthIn35mmFilm | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:FocalPlaneResolutionUnit | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:FocalPlaneXResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:FocalPlaneYResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:GainControl | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:Gamma | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:GPSAltitude | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:GPSAltitudeRef | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:GPSAreaInformation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:GPSDateStamp | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:GPSDestBearing | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:GPSDestBearingRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:GPSDestDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:GPSDestDistanceRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:GPSDestLatitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:GPSDestLatitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:GPSDestLongitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:GPSDestLongitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:GPSDifferential | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:GPSDOP | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:GPSHPositioningError | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:GPSImgDirection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:GPSImgDirectionRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:GPSInfoIFDPointer | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| Fairphone | EXIF:GPSLatitude | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:GPSLatitudeRef | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:GPSLongitude | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:GPSLongitudeRef | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:GPSMapDatum | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:GPSMeasureMode | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:GPSProcessingMethod | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:GPSSatellites | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:GPSSpeed | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:GPSSpeedRef | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:GPSStatus | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:GPSTimeStamp | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:GPSTrack | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:GPSTrackRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:GPSVersionID | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:Humidity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:ImageDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:ImageEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:ImageEditor | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:ImageLength | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:ImageTitle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:ImageUniqueID | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:ImageWidth | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:InteroperabilityIFDPointer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:InteroperabilityIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:InteroperabilityVersion | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:ISOSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:ISOSpeedLatitudeyyy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:ISOSpeedLatitudezzz | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:ISOSpeedRatings | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:JPEGInterchangeFormat | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:JPEGInterchangeFormatLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:LearningOptOutIn | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:LensMake | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:LensModel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:LensSerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:LensSpecification | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:LightSource | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:Make | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:MakerNote | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:MaxApertureValue | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:MetadataEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:MeteringMode | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:Model | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:NoiseReduction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:OECF | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:OffsetTime | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:OffsetTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:OffsetTimeOriginal | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:Orientation | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:Photographer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:PhotometricInterpretation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:PixelXDimension | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:PixelYDimension | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:PlanarConfiguration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:Pressure | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:PrimaryChromaticities | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:RAWDevelopingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:RecommendedExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:ReferenceBlackWhite | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:RelatedImageFileFormat | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:RelatedImageLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:RelatedImageWidth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:RelatedSoundFile | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:ResolutionUnit | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:RowsPerStrip | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:SamplesPerPixel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:Saturation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:SceneCaptureType | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:SceneType | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:SensingMethod | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:SensitivityType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:ShadingCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:Sharpness | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:ShutterSpeedValue | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:Software | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:SourceExposureTimesOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:SourceImageNumberOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:SpatialFrequencyResponse | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:SpectralSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:StandardOutputSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:StripByteCounts | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:StripOffsets | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:SubjectArea | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:SubjectDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:SubjectDistanceRange | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:SubjectLocation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:SubSecTime | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:SubSecTimeDigitized | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:SubSecTimeOriginal | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:Temperature | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:TransferFunction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:UserComment | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:WaterDepth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:WhiteBalance | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:WhitePoint | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:XResolution | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:YCbCrCoefficients | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:YCbCrPositioning | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:YCbCrSubSampling | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | EXIF:YResolution | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Fairphone | IPTC:Byline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | IPTC:Caption | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | IPTC:City | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | IPTC:CopyrightNotice | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | IPTC:CountryCode | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | IPTC:DateCreated | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | IPTC:Headline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | IPTC:Keywords | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | IPTC:ObjectName | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | XMP:XMP-dc:Creator | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | XMP:XMP-dc:Description | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | XMP:XMP-dc:Title | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Fairphone | XMP:XMP-xmp:CreateDate | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | block:EXIF | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Flip | block:ICC | ICC | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| Flip | block:IPTC | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | block:JFIF | JFIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | block:XMP | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | DIMENSIONS:height | DIMENSIONS | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Flip | DIMENSIONS:width | DIMENSIONS | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:Acceleration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:ApertureValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:Artist | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:BitsPerSample | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:BodySerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:BrightnessValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:CameraElevationAngle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:CameraFirmware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:CameraOwnerName | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:CFAPattern | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:ChromaticAberrationCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:ColorSpace | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:ComponentsConfiguration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:CompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:CompressedBitsPerPixel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:Compression | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:Contrast | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:Copyright | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:CustomRendered | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:DateTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:DateTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:DateTimeOriginal | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Flip | EXIF:DevelopmentType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:DevelopmentTypeDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:DeviceSettingDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:DigitalZoomRatio | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:DistortionCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:ExifIFDPointer | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| Flip | EXIF:ExifVersion | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:ExposureBiasValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:ExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:ExposureMode | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:ExposureProgram | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:ExposureTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:FileSource | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:Flash | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:FlashEnergy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:FlashpixVersion | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:FNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:FocalLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:FocalLengthIn35mmFilm | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:FocalPlaneResolutionUnit | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:FocalPlaneXResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:FocalPlaneYResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:GainControl | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:Gamma | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:GPSAltitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:GPSAltitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:GPSAreaInformation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:GPSDateStamp | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:GPSDestBearing | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:GPSDestBearingRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:GPSDestDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:GPSDestDistanceRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:GPSDestLatitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:GPSDestLatitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:GPSDestLongitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:GPSDestLongitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:GPSDifferential | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:GPSDOP | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:GPSHPositioningError | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:GPSImgDirection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:GPSImgDirectionRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:GPSInfoIFDPointer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:GPSLatitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:GPSLatitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:GPSLongitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:GPSLongitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:GPSMapDatum | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:GPSMeasureMode | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:GPSProcessingMethod | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:GPSSatellites | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:GPSSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:GPSSpeedRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:GPSStatus | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:GPSTimeStamp | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:GPSTrack | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:GPSTrackRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:GPSVersionID | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:Humidity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:ImageDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:ImageEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:ImageEditor | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:ImageLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:ImageTitle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:ImageUniqueID | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:ImageWidth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:InteroperabilityIFDPointer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:InteroperabilityIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:InteroperabilityVersion | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:ISOSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:ISOSpeedLatitudeyyy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:ISOSpeedLatitudezzz | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:ISOSpeedRatings | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:JPEGInterchangeFormat | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:JPEGInterchangeFormatLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:LearningOptOutIn | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:LensMake | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:LensModel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:LensSerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:LensSpecification | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:LightSource | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:Make | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:MakerNote | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:MaxApertureValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:MetadataEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:MeteringMode | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:Model | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:NoiseReduction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:OECF | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:OffsetTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:OffsetTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:OffsetTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:Orientation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:Photographer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:PhotometricInterpretation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:PixelXDimension | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:PixelYDimension | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:PlanarConfiguration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:Pressure | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:PrimaryChromaticities | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:RAWDevelopingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:RecommendedExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:ReferenceBlackWhite | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:RelatedImageFileFormat | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:RelatedImageLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:RelatedImageWidth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:RelatedSoundFile | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:ResolutionUnit | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:RowsPerStrip | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:SamplesPerPixel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:Saturation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:SceneCaptureType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:SceneType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:SensingMethod | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:SensitivityType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:ShadingCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:Sharpness | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:ShutterSpeedValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:Software | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:SourceExposureTimesOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:SourceImageNumberOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:SpatialFrequencyResponse | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:SpectralSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:StandardOutputSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:StripByteCounts | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:StripOffsets | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:SubjectArea | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:SubjectDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:SubjectDistanceRange | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:SubjectLocation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:SubSecTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:SubSecTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:SubSecTimeOriginal | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Flip | EXIF:Temperature | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:TransferFunction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:UserComment | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:WaterDepth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:WhiteBalance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:WhitePoint | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:XResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:YCbCrCoefficients | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:YCbCrPositioning | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:YCbCrSubSampling | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | EXIF:YResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | IPTC:Byline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | IPTC:Caption | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | IPTC:City | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | IPTC:CopyrightNotice | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | IPTC:CountryCode | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | IPTC:DateCreated | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | IPTC:Headline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | IPTC:Keywords | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | IPTC:ObjectName | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | XMP:XMP-dc:Creator | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | XMP:XMP-dc:Description | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | XMP:XMP-dc:Title | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Flip | XMP:XMP-xmp:CreateDate | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | block:EXIF | EXIF | 7 | 7 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | block:ICC | ICC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | block:IPTC | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | block:JFIF | JFIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | block:XMP | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | DIMENSIONS:height | DIMENSIONS | 7 | 6 | 0 | 0 | 0 | 1 | 0 |
| FUJIFILM | DIMENSIONS:width | DIMENSIONS | 7 | 6 | 0 | 0 | 0 | 1 | 0 |
| FUJIFILM | EXIF:Acceleration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:ApertureValue | EXIF | 7 | 0 | 7 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:Artist | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:BitsPerSample | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:BodySerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:BrightnessValue | EXIF | 7 | 0 | 7 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:CameraElevationAngle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:CameraFirmware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:CameraOwnerName | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:CFAPattern | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:ChromaticAberrationCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:ColorSpace | EXIF | 7 | 7 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:ComponentsConfiguration | EXIF | 6 | 6 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:CompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:CompressedBitsPerPixel | EXIF | 6 | 0 | 6 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:Compression | EXIF | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:Contrast | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:Copyright | EXIF | 7 | 0 | 7 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:CustomRendered | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:DateTime | EXIF | 7 | 0 | 7 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:DateTimeDigitized | EXIF | 7 | 0 | 7 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:DateTimeOriginal | EXIF | 7 | 0 | 7 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:DevelopmentType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:DevelopmentTypeDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:DeviceSettingDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:DigitalZoomRatio | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:DistortionCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:ExifIFDPointer | EXIF | 7 | 0 | 0 | 0 | 0 | 7 | 0 |
| FUJIFILM | EXIF:ExifVersion | EXIF | 7 | 0 | 7 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:ExposureBiasValue | EXIF | 7 | 0 | 7 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:ExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:ExposureMode | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:ExposureProgram | EXIF | 7 | 7 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:ExposureTime | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:FileSource | EXIF | 7 | 7 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:Flash | EXIF | 7 | 7 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:FlashEnergy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:FlashpixVersion | EXIF | 7 | 0 | 7 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:FNumber | EXIF | 7 | 0 | 7 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:FocalLength | EXIF | 7 | 0 | 7 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:FocalLengthIn35mmFilm | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:FocalPlaneResolutionUnit | EXIF | 7 | 7 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:FocalPlaneXResolution | EXIF | 7 | 0 | 7 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:FocalPlaneYResolution | EXIF | 7 | 0 | 7 | 0 | 0 | 0 | 0 |
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
| FUJIFILM | EXIF:ImageLength | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:ImageTitle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:ImageUniqueID | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:ImageWidth | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:InteroperabilityIFDPointer | EXIF | 6 | 0 | 0 | 0 | 0 | 6 | 0 |
| FUJIFILM | EXIF:InteroperabilityIndex | EXIF | 6 | 0 | 0 | 0 | 0 | 6 | 0 |
| FUJIFILM | EXIF:InteroperabilityVersion | EXIF | 6 | 0 | 0 | 0 | 0 | 6 | 0 |
| FUJIFILM | EXIF:ISOSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:ISOSpeedLatitudeyyy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:ISOSpeedLatitudezzz | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:ISOSpeedRatings | EXIF | 7 | 7 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:JPEGInterchangeFormat | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:JPEGInterchangeFormatLength | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:LearningOptOutIn | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:LensMake | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:LensModel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:LensSerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:LensSpecification | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:LightSource | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:Make | EXIF | 7 | 7 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:MakerNote | EXIF | 4 | 0 | 0 | 0 | 0 | 4 | 0 |
| FUJIFILM | EXIF:MaxApertureValue | EXIF | 7 | 0 | 7 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:MetadataEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:MeteringMode | EXIF | 7 | 7 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:Model | EXIF | 7 | 5 | 2 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:NoiseReduction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:OECF | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:OffsetTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:OffsetTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:OffsetTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:Orientation | EXIF | 7 | 7 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:Photographer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:PhotometricInterpretation | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:PixelXDimension | EXIF | 6 | 6 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:PixelYDimension | EXIF | 6 | 6 | 0 | 0 | 0 | 0 | 0 |
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
| FUJIFILM | EXIF:ResolutionUnit | EXIF | 7 | 7 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:RowsPerStrip | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:SamplesPerPixel | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:Saturation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:SceneCaptureType | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:SceneType | EXIF | 7 | 7 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:SensingMethod | EXIF | 7 | 7 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:SensitivityType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:ShadingCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:Sharpness | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:ShutterSpeedValue | EXIF | 7 | 0 | 7 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:Software | EXIF | 7 | 7 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:SourceExposureTimesOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:SourceImageNumberOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:SpatialFrequencyResponse | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:SpectralSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:StandardOutputSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:StripByteCounts | EXIF | 1 | 0 | 0 | 0 | 0 | 0 | 1 |
| FUJIFILM | EXIF:StripOffsets | EXIF | 1 | 0 | 0 | 0 | 0 | 0 | 1 |
| FUJIFILM | EXIF:SubjectArea | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:SubjectDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:SubjectDistanceRange | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:SubjectLocation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:SubSecTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:SubSecTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:SubSecTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:Temperature | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:TransferFunction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:UserComment | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:WaterDepth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:WhiteBalance | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:WhitePoint | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:XResolution | EXIF | 7 | 0 | 7 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:YCbCrCoefficients | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:YCbCrPositioning | EXIF | 7 | 7 | 0 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:YCbCrSubSampling | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| FUJIFILM | EXIF:YResolution | EXIF | 7 | 0 | 7 | 0 | 0 | 0 | 0 |
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
| Google | block:EXIF | EXIF | 14 | 14 | 0 | 0 | 0 | 0 | 0 |
| Google | block:ICC | ICC | 13 | 2 | 0 | 0 | 0 | 11 | 0 |
| Google | block:IPTC | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | block:JFIF | JFIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Google | block:XMP | XMP | 13 | 13 | 0 | 0 | 0 | 0 | 0 |
| Google | DIMENSIONS:height | DIMENSIONS | 14 | 14 | 0 | 0 | 0 | 0 | 0 |
| Google | DIMENSIONS:width | DIMENSIONS | 14 | 14 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:Acceleration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:ApertureValue | EXIF | 14 | 0 | 14 | 0 | 0 | 0 | 0 |
| Google | EXIF:Artist | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:BitsPerSample | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:BodySerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:BrightnessValue | EXIF | 13 | 0 | 13 | 0 | 0 | 0 | 0 |
| Google | EXIF:CameraElevationAngle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:CameraFirmware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:CameraOwnerName | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:CFAPattern | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:ChromaticAberrationCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:ColorSpace | EXIF | 6 | 6 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:ComponentsConfiguration | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:CompositeImage | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:CompressedBitsPerPixel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:Compression | EXIF | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:Contrast | EXIF | 13 | 13 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:Copyright | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:CustomRendered | EXIF | 13 | 13 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:DateTime | EXIF | 14 | 0 | 14 | 0 | 0 | 0 | 0 |
| Google | EXIF:DateTimeDigitized | EXIF | 14 | 0 | 14 | 0 | 0 | 0 | 0 |
| Google | EXIF:DateTimeOriginal | EXIF | 14 | 0 | 14 | 0 | 0 | 0 | 0 |
| Google | EXIF:DevelopmentType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:DevelopmentTypeDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:DeviceSettingDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:DigitalZoomRatio | EXIF | 14 | 0 | 14 | 0 | 0 | 0 | 0 |
| Google | EXIF:DistortionCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:ExifIFDPointer | EXIF | 14 | 0 | 0 | 0 | 0 | 14 | 0 |
| Google | EXIF:ExifVersion | EXIF | 14 | 0 | 14 | 0 | 0 | 0 | 0 |
| Google | EXIF:ExposureBiasValue | EXIF | 13 | 0 | 13 | 0 | 0 | 0 | 0 |
| Google | EXIF:ExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:ExposureMode | EXIF | 14 | 14 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:ExposureProgram | EXIF | 13 | 13 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:ExposureTime | EXIF | 14 | 0 | 14 | 0 | 0 | 0 | 0 |
| Google | EXIF:FileSource | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:Flash | EXIF | 14 | 14 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:FlashEnergy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:FlashpixVersion | EXIF | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| Google | EXIF:FNumber | EXIF | 14 | 0 | 14 | 0 | 0 | 0 | 0 |
| Google | EXIF:FocalLength | EXIF | 14 | 0 | 14 | 0 | 0 | 0 | 0 |
| Google | EXIF:FocalLengthIn35mmFilm | EXIF | 14 | 14 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:FocalPlaneResolutionUnit | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:FocalPlaneXResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:FocalPlaneYResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:GainControl | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:Gamma | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:GPSAltitude | EXIF | 13 | 0 | 13 | 0 | 0 | 0 | 0 |
| Google | EXIF:GPSAltitudeRef | EXIF | 13 | 13 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:GPSAreaInformation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:GPSDateStamp | EXIF | 13 | 0 | 13 | 0 | 0 | 0 | 0 |
| Google | EXIF:GPSDestBearing | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:GPSDestBearingRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:GPSDestDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:GPSDestDistanceRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:GPSDestLatitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:GPSDestLatitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:GPSDestLongitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:GPSDestLongitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:GPSDifferential | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:GPSDOP | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:GPSHPositioningError | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:GPSImgDirection | EXIF | 13 | 0 | 13 | 0 | 0 | 0 | 0 |
| Google | EXIF:GPSImgDirectionRef | EXIF | 13 | 13 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:GPSInfoIFDPointer | EXIF | 13 | 0 | 0 | 0 | 0 | 13 | 0 |
| Google | EXIF:GPSLatitude | EXIF | 13 | 13 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:GPSLatitudeRef | EXIF | 13 | 13 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:GPSLongitude | EXIF | 13 | 13 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:GPSLongitudeRef | EXIF | 13 | 13 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:GPSMapDatum | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:GPSMeasureMode | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:GPSProcessingMethod | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:GPSSatellites | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:GPSSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:GPSSpeedRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:GPSStatus | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:GPSTimeStamp | EXIF | 13 | 0 | 13 | 0 | 0 | 0 | 0 |
| Google | EXIF:GPSTrack | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:GPSTrackRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:GPSVersionID | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:Humidity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:ImageDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:ImageEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:ImageEditor | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:ImageLength | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:ImageTitle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:ImageUniqueID | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:ImageWidth | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:InteroperabilityIFDPointer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:InteroperabilityIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:InteroperabilityVersion | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:ISOSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:ISOSpeedLatitudeyyy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:ISOSpeedLatitudezzz | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:ISOSpeedRatings | EXIF | 14 | 14 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:JPEGInterchangeFormat | EXIF | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:JPEGInterchangeFormatLength | EXIF | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:LearningOptOutIn | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:LensMake | EXIF | 13 | 13 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:LensModel | EXIF | 13 | 13 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:LensSerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:LensSpecification | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:LightSource | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:Make | EXIF | 14 | 13 | 1 | 0 | 0 | 0 | 0 |
| Google | EXIF:MakerNote | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:MaxApertureValue | EXIF | 13 | 0 | 13 | 0 | 0 | 0 | 0 |
| Google | EXIF:MetadataEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:MeteringMode | EXIF | 13 | 13 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:Model | EXIF | 14 | 13 | 1 | 0 | 0 | 0 | 0 |
| Google | EXIF:NoiseReduction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:OECF | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:OffsetTime | EXIF | 13 | 13 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:OffsetTimeDigitized | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:OffsetTimeOriginal | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:Orientation | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:Photographer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:PhotometricInterpretation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:PixelXDimension | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:PixelYDimension | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:PlanarConfiguration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:Pressure | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:PrimaryChromaticities | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:RAWDevelopingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:RecommendedExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:ReferenceBlackWhite | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:RelatedImageFileFormat | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:RelatedImageLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:RelatedImageWidth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:RelatedSoundFile | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:ResolutionUnit | EXIF | 8 | 8 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:RowsPerStrip | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:SamplesPerPixel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:Saturation | EXIF | 13 | 13 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:SceneCaptureType | EXIF | 13 | 13 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:SceneType | EXIF | 13 | 13 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:SensingMethod | EXIF | 13 | 13 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:SensitivityType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:ShadingCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:Sharpness | EXIF | 13 | 13 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:ShutterSpeedValue | EXIF | 14 | 0 | 14 | 0 | 0 | 0 | 0 |
| Google | EXIF:Software | EXIF | 13 | 13 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:SourceExposureTimesOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:SourceImageNumberOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:SpatialFrequencyResponse | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:SpectralSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:StandardOutputSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:StripByteCounts | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:StripOffsets | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:SubjectArea | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:SubjectDistance | EXIF | 14 | 0 | 14 | 0 | 0 | 0 | 0 |
| Google | EXIF:SubjectDistanceRange | EXIF | 14 | 14 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:SubjectLocation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:SubSecTime | EXIF | 4 | 3 | 1 | 0 | 0 | 0 | 0 |
| Google | EXIF:SubSecTimeDigitized | EXIF | 4 | 3 | 1 | 0 | 0 | 0 | 0 |
| Google | EXIF:SubSecTimeOriginal | EXIF | 4 | 3 | 1 | 0 | 0 | 0 | 0 |
| Google | EXIF:Temperature | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:TransferFunction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:UserComment | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:WaterDepth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:WhiteBalance | EXIF | 14 | 14 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:WhitePoint | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:XResolution | EXIF | 8 | 0 | 8 | 0 | 0 | 0 | 0 |
| Google | EXIF:YCbCrCoefficients | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:YCbCrPositioning | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:YCbCrSubSampling | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | EXIF:YResolution | EXIF | 8 | 0 | 8 | 0 | 0 | 0 | 0 |
| Google | IPTC:Byline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | IPTC:Caption | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | IPTC:City | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | IPTC:CopyrightNotice | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | IPTC:CountryCode | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | IPTC:DateCreated | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | IPTC:Headline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | IPTC:Keywords | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | IPTC:ObjectName | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | XMP:XMP-dc:Creator | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | XMP:XMP-dc:Description | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | XMP:XMP-dc:Title | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Google | XMP:XMP-xmp:CreateDate | XMP | 10 | 0 | 10 | 0 | 0 | 0 | 0 |
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
| KONICA MINOLTA | block:EXIF | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | block:ICC | ICC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | block:IPTC | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | block:JFIF | JFIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | block:XMP | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | DIMENSIONS:height | DIMENSIONS | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | DIMENSIONS:width | DIMENSIONS | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:Acceleration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:ApertureValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:Artist | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:BitsPerSample | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:BodySerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:BrightnessValue | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:CameraElevationAngle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:CameraFirmware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:CameraOwnerName | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:CFAPattern | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:ChromaticAberrationCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:ColorSpace | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:ComponentsConfiguration | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:CompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:CompressedBitsPerPixel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:Compression | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:Contrast | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:Copyright | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:CustomRendered | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:DateTime | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:DateTimeDigitized | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:DateTimeOriginal | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:DevelopmentType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:DevelopmentTypeDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:DeviceSettingDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:DigitalZoomRatio | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:DistortionCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:ExifIFDPointer | EXIF | 2 | 0 | 0 | 0 | 0 | 2 | 0 |
| KONICA MINOLTA | EXIF:ExifVersion | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:ExposureBiasValue | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:ExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:ExposureMode | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:ExposureProgram | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:ExposureTime | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:FileSource | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:Flash | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:FlashEnergy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:FlashpixVersion | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:FNumber | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:FocalLength | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:FocalLengthIn35mmFilm | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:FocalPlaneResolutionUnit | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:FocalPlaneXResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:FocalPlaneYResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:GainControl | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
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
| KONICA MINOLTA | EXIF:ImageDescription | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:ImageEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:ImageEditor | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:ImageLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:ImageTitle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:ImageUniqueID | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:ImageWidth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:InteroperabilityIFDPointer | EXIF | 2 | 0 | 0 | 0 | 0 | 2 | 0 |
| KONICA MINOLTA | EXIF:InteroperabilityIndex | EXIF | 2 | 0 | 0 | 0 | 0 | 2 | 0 |
| KONICA MINOLTA | EXIF:InteroperabilityVersion | EXIF | 2 | 0 | 0 | 0 | 0 | 2 | 0 |
| KONICA MINOLTA | EXIF:ISOSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:ISOSpeedLatitudeyyy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:ISOSpeedLatitudezzz | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:ISOSpeedRatings | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:JPEGInterchangeFormat | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:JPEGInterchangeFormatLength | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:LearningOptOutIn | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:LensMake | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:LensModel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:LensSerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:LensSpecification | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:LightSource | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:Make | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:MakerNote | EXIF | 2 | 0 | 0 | 0 | 0 | 2 | 0 |
| KONICA MINOLTA | EXIF:MaxApertureValue | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:MetadataEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:MeteringMode | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:Model | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:NoiseReduction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:OECF | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:OffsetTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:OffsetTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:OffsetTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:Orientation | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:Photographer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:PhotometricInterpretation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:PixelXDimension | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:PixelYDimension | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
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
| KONICA MINOLTA | EXIF:ResolutionUnit | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:RowsPerStrip | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:SamplesPerPixel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:Saturation | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:SceneCaptureType | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:SceneType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:SensingMethod | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:SensitivityType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:ShadingCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:Sharpness | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:ShutterSpeedValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:Software | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:SourceExposureTimesOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:SourceImageNumberOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:SpatialFrequencyResponse | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:SpectralSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:StandardOutputSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:StripByteCounts | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:StripOffsets | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:SubjectArea | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:SubjectDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:SubjectDistanceRange | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:SubjectLocation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:SubSecTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:SubSecTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:SubSecTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:Temperature | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:TransferFunction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:UserComment | EXIF | 2 | 0 | 0 | 0 | 0 | 2 | 0 |
| KONICA MINOLTA | EXIF:WaterDepth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:WhiteBalance | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:WhitePoint | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:XResolution | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:YCbCrCoefficients | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:YCbCrPositioning | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:YCbCrSubSampling | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| KONICA MINOLTA | EXIF:YResolution | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
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
| NIKON | block:EXIF | EXIF | 19 | 19 | 0 | 0 | 0 | 0 | 0 |
| NIKON | block:ICC | ICC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | block:IPTC | IPTC | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| NIKON | block:JFIF | JFIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| NIKON | block:XMP | XMP | 9 | 9 | 0 | 0 | 0 | 0 | 0 |
| NIKON | DIMENSIONS:height | DIMENSIONS | 19 | 19 | 0 | 0 | 0 | 0 | 0 |
| NIKON | DIMENSIONS:width | DIMENSIONS | 19 | 19 | 0 | 0 | 0 | 0 | 0 |
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
| NIKON | EXIF:ColorSpace | EXIF | 19 | 19 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:ComponentsConfiguration | EXIF | 19 | 19 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:CompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:CompressedBitsPerPixel | EXIF | 10 | 0 | 10 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:Compression | EXIF | 19 | 19 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:Contrast | EXIF | 18 | 18 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:Copyright | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:CustomRendered | EXIF | 18 | 18 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:DateTime | EXIF | 19 | 0 | 19 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:DateTimeDigitized | EXIF | 19 | 0 | 19 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:DateTimeOriginal | EXIF | 19 | 0 | 19 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:DevelopmentType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:DevelopmentTypeDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:DeviceSettingDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:DigitalZoomRatio | EXIF | 18 | 0 | 18 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:DistortionCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:ExifIFDPointer | EXIF | 19 | 0 | 0 | 0 | 0 | 19 | 0 |
| NIKON | EXIF:ExifVersion | EXIF | 19 | 0 | 19 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:ExposureBiasValue | EXIF | 19 | 0 | 19 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:ExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:ExposureMode | EXIF | 18 | 18 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:ExposureProgram | EXIF | 19 | 19 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:ExposureTime | EXIF | 19 | 0 | 19 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:FileSource | EXIF | 19 | 19 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:Flash | EXIF | 19 | 19 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:FlashEnergy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:FlashpixVersion | EXIF | 19 | 0 | 19 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:FNumber | EXIF | 19 | 0 | 19 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:FocalLength | EXIF | 19 | 0 | 19 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:FocalLengthIn35mmFilm | EXIF | 18 | 18 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:FocalPlaneResolutionUnit | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:FocalPlaneXResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:FocalPlaneYResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:GainControl | EXIF | 18 | 18 | 0 | 0 | 0 | 0 | 0 |
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
| NIKON | EXIF:ImageDescription | EXIF | 19 | 19 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:ImageEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:ImageEditor | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:ImageLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:ImageTitle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:ImageUniqueID | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:ImageWidth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:InteroperabilityIFDPointer | EXIF | 19 | 0 | 0 | 0 | 0 | 19 | 0 |
| NIKON | EXIF:InteroperabilityIndex | EXIF | 19 | 0 | 0 | 0 | 0 | 19 | 0 |
| NIKON | EXIF:InteroperabilityVersion | EXIF | 19 | 0 | 0 | 0 | 0 | 19 | 0 |
| NIKON | EXIF:ISOSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:ISOSpeedLatitudeyyy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:ISOSpeedLatitudezzz | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:ISOSpeedRatings | EXIF | 19 | 19 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:JPEGInterchangeFormat | EXIF | 19 | 19 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:JPEGInterchangeFormatLength | EXIF | 19 | 19 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:LearningOptOutIn | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:LensMake | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:LensModel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:LensSerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:LensSpecification | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:LightSource | EXIF | 19 | 19 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:Make | EXIF | 19 | 19 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:MakerNote | EXIF | 19 | 0 | 0 | 0 | 0 | 19 | 0 |
| NIKON | EXIF:MaxApertureValue | EXIF | 19 | 0 | 19 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:MetadataEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:MeteringMode | EXIF | 19 | 19 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:Model | EXIF | 19 | 11 | 8 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:NoiseReduction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:OECF | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:OffsetTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:OffsetTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:OffsetTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:Orientation | EXIF | 19 | 19 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:Photographer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:PhotometricInterpretation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:PixelXDimension | EXIF | 19 | 19 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:PixelYDimension | EXIF | 19 | 19 | 0 | 0 | 0 | 0 | 0 |
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
| NIKON | EXIF:ResolutionUnit | EXIF | 19 | 19 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:RowsPerStrip | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:SamplesPerPixel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:Saturation | EXIF | 18 | 18 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:SceneCaptureType | EXIF | 18 | 18 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:SceneType | EXIF | 19 | 19 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:SensingMethod | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:SensitivityType | EXIF | 8 | 8 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:ShadingCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:Sharpness | EXIF | 18 | 18 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:ShutterSpeedValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:Software | EXIF | 19 | 19 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:SourceExposureTimesOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:SourceImageNumberOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:SpatialFrequencyResponse | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:SpectralSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:StandardOutputSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:StripByteCounts | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:StripOffsets | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:SubjectArea | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:SubjectDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:SubjectDistanceRange | EXIF | 18 | 18 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:SubjectLocation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:SubSecTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:SubSecTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:SubSecTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:Temperature | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:TransferFunction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:UserComment | EXIF | 19 | 0 | 19 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:WaterDepth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:WhiteBalance | EXIF | 18 | 18 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:WhitePoint | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:XResolution | EXIF | 19 | 0 | 19 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:YCbCrCoefficients | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:YCbCrPositioning | EXIF | 19 | 19 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:YCbCrSubSampling | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON | EXIF:YResolution | EXIF | 19 | 0 | 19 | 0 | 0 | 0 | 0 |
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
| NIKON CORPORATION | block:EXIF | EXIF | 6 | 6 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | block:ICC | ICC | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | block:IPTC | IPTC | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | block:JFIF | JFIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | block:XMP | XMP | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | DIMENSIONS:height | DIMENSIONS | 6 | 6 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | DIMENSIONS:width | DIMENSIONS | 6 | 6 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:Acceleration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:ApertureValue | EXIF | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:Artist | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:BitsPerSample | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:BodySerialNumber | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:BrightnessValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:CameraElevationAngle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:CameraFirmware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:CameraOwnerName | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:CFAPattern | EXIF | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:ChromaticAberrationCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:ColorSpace | EXIF | 6 | 6 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:ComponentsConfiguration | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:CompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:CompressedBitsPerPixel | EXIF | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:Compression | EXIF | 6 | 6 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:Contrast | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:Copyright | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:CustomRendered | EXIF | 3 | 3 | 0 | 0 | 1 | 0 | 0 |
| NIKON CORPORATION | EXIF:DateTime | EXIF | 6 | 0 | 6 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:DateTimeDigitized | EXIF | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:DateTimeOriginal | EXIF | 6 | 0 | 6 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:DevelopmentType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:DevelopmentTypeDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:DeviceSettingDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:DigitalZoomRatio | EXIF | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:DistortionCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:ExifIFDPointer | EXIF | 6 | 0 | 0 | 0 | 0 | 6 | 0 |
| NIKON CORPORATION | EXIF:ExifVersion | EXIF | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:ExposureBiasValue | EXIF | 6 | 0 | 6 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:ExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:ExposureMode | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:ExposureProgram | EXIF | 6 | 6 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:ExposureTime | EXIF | 6 | 0 | 6 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:FileSource | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:Flash | EXIF | 6 | 6 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:FlashEnergy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:FlashpixVersion | EXIF | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:FNumber | EXIF | 6 | 0 | 6 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:FocalLength | EXIF | 6 | 0 | 6 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:FocalLengthIn35mmFilm | EXIF | 6 | 6 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:FocalPlaneResolutionUnit | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:FocalPlaneXResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:FocalPlaneYResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:GainControl | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
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
| NIKON CORPORATION | EXIF:InteroperabilityIFDPointer | EXIF | 2 | 0 | 0 | 0 | 0 | 2 | 0 |
| NIKON CORPORATION | EXIF:InteroperabilityIndex | EXIF | 2 | 0 | 0 | 0 | 0 | 2 | 0 |
| NIKON CORPORATION | EXIF:InteroperabilityVersion | EXIF | 2 | 0 | 0 | 0 | 0 | 2 | 0 |
| NIKON CORPORATION | EXIF:ISOSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:ISOSpeedLatitudeyyy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:ISOSpeedLatitudezzz | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:ISOSpeedRatings | EXIF | 6 | 6 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:JPEGInterchangeFormat | EXIF | 6 | 6 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:JPEGInterchangeFormatLength | EXIF | 6 | 6 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:LearningOptOutIn | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:LensMake | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:LensModel | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:LensSerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:LensSpecification | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| NIKON CORPORATION | EXIF:LightSource | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:Make | EXIF | 6 | 6 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:MakerNote | EXIF | 4 | 0 | 0 | 0 | 0 | 4 | 0 |
| NIKON CORPORATION | EXIF:MaxApertureValue | EXIF | 6 | 0 | 6 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:MetadataEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:MeteringMode | EXIF | 6 | 6 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:Model | EXIF | 6 | 6 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:NoiseReduction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:OECF | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:OffsetTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:OffsetTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:OffsetTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:Orientation | EXIF | 6 | 6 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:Photographer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:PhotometricInterpretation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:PixelXDimension | EXIF | 6 | 6 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:PixelYDimension | EXIF | 6 | 6 | 0 | 0 | 0 | 0 | 0 |
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
| NIKON CORPORATION | EXIF:ResolutionUnit | EXIF | 6 | 6 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:RowsPerStrip | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:SamplesPerPixel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:Saturation | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:SceneCaptureType | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:SceneType | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:SensingMethod | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:SensitivityType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:ShadingCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:Sharpness | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:ShutterSpeedValue | EXIF | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:Software | EXIF | 6 | 5 | 1 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:SourceExposureTimesOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:SourceImageNumberOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:SpatialFrequencyResponse | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:SpectralSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:StandardOutputSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:StripByteCounts | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:StripOffsets | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:SubjectArea | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:SubjectDistance | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:SubjectDistanceRange | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:SubjectLocation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:SubSecTime | EXIF | 3 | 1 | 2 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:SubSecTimeDigitized | EXIF | 3 | 1 | 2 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:SubSecTimeOriginal | EXIF | 3 | 1 | 2 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:Temperature | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:TransferFunction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:UserComment | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:WaterDepth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:WhiteBalance | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:WhitePoint | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:XResolution | EXIF | 6 | 1 | 5 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:YCbCrCoefficients | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:YCbCrPositioning | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:YCbCrSubSampling | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| NIKON CORPORATION | EXIF:YResolution | EXIF | 6 | 1 | 5 | 0 | 0 | 0 | 0 |
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
| NIKON CORPORATION | XMP:XMP-xmp:CreateDate | XMP | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| Nokia | block:EXIF | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| Nokia | block:ICC | ICC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | block:IPTC | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | block:JFIF | JFIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | block:XMP | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | DIMENSIONS:height | DIMENSIONS | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| Nokia | DIMENSIONS:width | DIMENSIONS | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:Acceleration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:ApertureValue | EXIF | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:Artist | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:BitsPerSample | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:BodySerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:BrightnessValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:CameraElevationAngle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:CameraFirmware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:CameraOwnerName | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:CFAPattern | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:ChromaticAberrationCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:ColorSpace | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:ComponentsConfiguration | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:CompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:CompressedBitsPerPixel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:Compression | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:Contrast | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:Copyright | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:CustomRendered | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:DateTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:DateTimeDigitized | EXIF | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:DateTimeOriginal | EXIF | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:DevelopmentType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:DevelopmentTypeDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:DeviceSettingDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:DigitalZoomRatio | EXIF | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:DistortionCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:ExifIFDPointer | EXIF | 4 | 0 | 0 | 0 | 0 | 4 | 0 |
| Nokia | EXIF:ExifVersion | EXIF | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:ExposureBiasValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:ExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:ExposureMode | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:ExposureProgram | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:ExposureTime | EXIF | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:FileSource | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:Flash | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:FlashEnergy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:FlashpixVersion | EXIF | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:FNumber | EXIF | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:FocalLength | EXIF | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:FocalLengthIn35mmFilm | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:FocalPlaneResolutionUnit | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:FocalPlaneXResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:FocalPlaneYResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:GainControl | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:Gamma | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:GPSAltitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:GPSAltitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:GPSAreaInformation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:GPSDateStamp | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:GPSDestBearing | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:GPSDestBearingRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:GPSDestDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:GPSDestDistanceRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:GPSDestLatitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:GPSDestLatitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:GPSDestLongitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:GPSDestLongitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:GPSDifferential | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:GPSDOP | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:GPSHPositioningError | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:GPSImgDirection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:GPSImgDirectionRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:GPSInfoIFDPointer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:GPSLatitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:GPSLatitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:GPSLongitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:GPSLongitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:GPSMapDatum | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:GPSMeasureMode | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:GPSProcessingMethod | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:GPSSatellites | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:GPSSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:GPSSpeedRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:GPSStatus | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:GPSTimeStamp | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:GPSTrack | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:GPSTrackRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:GPSVersionID | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:Humidity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:ImageDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:ImageEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:ImageEditor | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:ImageLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:ImageTitle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:ImageUniqueID | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:ImageWidth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:InteroperabilityIFDPointer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:InteroperabilityIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:InteroperabilityVersion | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:ISOSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:ISOSpeedLatitudeyyy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:ISOSpeedLatitudezzz | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:ISOSpeedRatings | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:JPEGInterchangeFormat | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:JPEGInterchangeFormatLength | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:LearningOptOutIn | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:LensMake | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:LensModel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:LensSerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:LensSpecification | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:LightSource | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:Make | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:MakerNote | EXIF | 3 | 0 | 0 | 0 | 0 | 3 | 0 |
| Nokia | EXIF:MaxApertureValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:MetadataEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:MeteringMode | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:Model | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:NoiseReduction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:OECF | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:OffsetTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:OffsetTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:OffsetTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:Orientation | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:Photographer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:PhotometricInterpretation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:PixelXDimension | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:PixelYDimension | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:PlanarConfiguration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:Pressure | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:PrimaryChromaticities | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:RAWDevelopingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:RecommendedExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:ReferenceBlackWhite | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:RelatedImageFileFormat | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:RelatedImageLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:RelatedImageWidth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:RelatedSoundFile | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:ResolutionUnit | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:RowsPerStrip | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:SamplesPerPixel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:Saturation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:SceneCaptureType | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:SceneType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:SensingMethod | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:SensitivityType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:ShadingCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:Sharpness | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:ShutterSpeedValue | EXIF | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:Software | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:SourceExposureTimesOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:SourceImageNumberOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:SpatialFrequencyResponse | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:SpectralSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:StandardOutputSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:StripByteCounts | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:StripOffsets | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:SubjectArea | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:SubjectDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:SubjectDistanceRange | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:SubjectLocation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:SubSecTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:SubSecTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:SubSecTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:Temperature | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:TransferFunction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:UserComment | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:WaterDepth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:WhiteBalance | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:WhitePoint | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:XResolution | EXIF | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:YCbCrCoefficients | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:YCbCrPositioning | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:YCbCrSubSampling | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | EXIF:YResolution | EXIF | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| Nokia | IPTC:Byline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | IPTC:Caption | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | IPTC:City | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | IPTC:CopyrightNotice | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | IPTC:CountryCode | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | IPTC:DateCreated | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | IPTC:Headline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | IPTC:Keywords | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | IPTC:ObjectName | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | XMP:XMP-dc:Creator | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | XMP:XMP-dc:Description | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | XMP:XMP-dc:Title | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Nokia | XMP:XMP-xmp:CreateDate | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | block:EXIF | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | block:ICC | ICC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | block:IPTC | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | block:JFIF | JFIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | block:XMP | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | DIMENSIONS:height | DIMENSIONS | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | DIMENSIONS:width | DIMENSIONS | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:Acceleration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:ApertureValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:Artist | EXIF | 2 | 0 | 0 | 0 | 0 | 2 | 0 |
| OLYMPUS CORPORATION | EXIF:BitsPerSample | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:BodySerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:BrightnessValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:CameraElevationAngle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:CameraFirmware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:CameraOwnerName | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:CFAPattern | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:ChromaticAberrationCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:ColorSpace | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:ComponentsConfiguration | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:CompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:CompressedBitsPerPixel | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:Compression | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:Contrast | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:Copyright | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:CustomRendered | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:DateTime | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:DateTimeDigitized | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:DateTimeOriginal | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:DevelopmentType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:DevelopmentTypeDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:DeviceSettingDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:DigitalZoomRatio | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:DistortionCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:ExifIFDPointer | EXIF | 2 | 0 | 0 | 0 | 0 | 2 | 0 |
| OLYMPUS CORPORATION | EXIF:ExifVersion | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:ExposureBiasValue | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:ExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:ExposureMode | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:ExposureProgram | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:ExposureTime | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:FileSource | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:Flash | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:FlashEnergy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:FlashpixVersion | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:FNumber | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:FocalLength | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:FocalLengthIn35mmFilm | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:FocalPlaneResolutionUnit | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:FocalPlaneXResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:FocalPlaneYResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:GainControl | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
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
| OLYMPUS CORPORATION | EXIF:ImageUniqueID | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:ImageWidth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:InteroperabilityIFDPointer | EXIF | 2 | 0 | 0 | 0 | 0 | 2 | 0 |
| OLYMPUS CORPORATION | EXIF:InteroperabilityIndex | EXIF | 2 | 0 | 0 | 0 | 0 | 2 | 0 |
| OLYMPUS CORPORATION | EXIF:InteroperabilityVersion | EXIF | 2 | 0 | 0 | 0 | 0 | 2 | 0 |
| OLYMPUS CORPORATION | EXIF:ISOSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:ISOSpeedLatitudeyyy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:ISOSpeedLatitudezzz | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:ISOSpeedRatings | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:JPEGInterchangeFormat | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:JPEGInterchangeFormatLength | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:LearningOptOutIn | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:LensMake | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:LensModel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:LensSerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:LensSpecification | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:LightSource | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:Make | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:MakerNote | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:MaxApertureValue | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:MetadataEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:MeteringMode | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:Model | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:NoiseReduction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:OECF | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:OffsetTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:OffsetTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:OffsetTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:Orientation | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:Photographer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:PhotometricInterpretation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:PixelXDimension | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:PixelYDimension | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
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
| OLYMPUS CORPORATION | EXIF:ResolutionUnit | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:RowsPerStrip | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:SamplesPerPixel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:Saturation | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:SceneCaptureType | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:SceneType | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:SensingMethod | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:SensitivityType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:ShadingCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:Sharpness | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:ShutterSpeedValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:Software | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
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
| OLYMPUS CORPORATION | EXIF:SubSecTime | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:SubSecTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:SubSecTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:Temperature | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:TransferFunction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:UserComment | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:WaterDepth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:WhiteBalance | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:WhitePoint | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:XResolution | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:YCbCrCoefficients | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:YCbCrPositioning | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:YCbCrSubSampling | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS CORPORATION | EXIF:YResolution | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
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
| OLYMPUS IMAGING CORP. | block:EXIF | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | block:ICC | ICC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | block:IPTC | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | block:JFIF | JFIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | block:XMP | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | DIMENSIONS:height | DIMENSIONS | 4 | 3 | 0 | 0 | 0 | 1 | 0 |
| OLYMPUS IMAGING CORP. | DIMENSIONS:width | DIMENSIONS | 4 | 3 | 0 | 0 | 0 | 1 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:Acceleration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:ApertureValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:Artist | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:BitsPerSample | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:BodySerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:BrightnessValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:CameraElevationAngle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:CameraFirmware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:CameraOwnerName | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:CFAPattern | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:ChromaticAberrationCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:ColorSpace | EXIF | 3 | 3 | 0 | 0 | 1 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:ComponentsConfiguration | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:CompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:CompressedBitsPerPixel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:Compression | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:Contrast | EXIF | 3 | 3 | 0 | 0 | 1 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:Copyright | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:CustomRendered | EXIF | 3 | 3 | 0 | 0 | 1 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:DateTime | EXIF | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:DateTimeDigitized | EXIF | 3 | 0 | 3 | 0 | 1 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:DateTimeOriginal | EXIF | 3 | 0 | 3 | 0 | 1 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:DevelopmentType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:DevelopmentTypeDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:DeviceSettingDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:DigitalZoomRatio | EXIF | 3 | 0 | 3 | 0 | 1 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:DistortionCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:ExifIFDPointer | EXIF | 4 | 0 | 0 | 0 | 0 | 4 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:ExifVersion | EXIF | 3 | 0 | 3 | 0 | 1 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:ExposureBiasValue | EXIF | 3 | 0 | 3 | 0 | 1 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:ExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:ExposureMode | EXIF | 3 | 3 | 0 | 0 | 1 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:ExposureProgram | EXIF | 3 | 3 | 0 | 0 | 1 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:ExposureTime | EXIF | 3 | 0 | 3 | 0 | 1 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:FileSource | EXIF | 3 | 3 | 0 | 0 | 1 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:Flash | EXIF | 3 | 3 | 0 | 0 | 1 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:FlashEnergy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:FlashpixVersion | EXIF | 3 | 0 | 3 | 0 | 1 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:FNumber | EXIF | 3 | 0 | 3 | 0 | 1 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:FocalLength | EXIF | 3 | 0 | 3 | 0 | 1 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:FocalLengthIn35mmFilm | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:FocalPlaneResolutionUnit | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:FocalPlaneXResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:FocalPlaneYResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:GainControl | EXIF | 3 | 3 | 0 | 0 | 1 | 0 | 0 |
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
| OLYMPUS IMAGING CORP. | EXIF:ImageDescription | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:ImageEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:ImageEditor | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:ImageLength | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:ImageTitle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:ImageUniqueID | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:ImageWidth | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:InteroperabilityIFDPointer | EXIF | 3 | 0 | 0 | 0 | 0 | 3 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:InteroperabilityIndex | EXIF | 3 | 0 | 0 | 0 | 0 | 3 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:InteroperabilityVersion | EXIF | 3 | 0 | 0 | 0 | 0 | 3 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:ISOSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:ISOSpeedLatitudeyyy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:ISOSpeedLatitudezzz | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:ISOSpeedRatings | EXIF | 3 | 3 | 0 | 0 | 1 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:JPEGInterchangeFormat | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:JPEGInterchangeFormatLength | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:LearningOptOutIn | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:LensMake | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:LensModel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:LensSerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:LensSpecification | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:LightSource | EXIF | 3 | 3 | 0 | 0 | 1 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:Make | EXIF | 4 | 1 | 3 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:MakerNote | EXIF | 3 | 0 | 0 | 0 | 0 | 3 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:MaxApertureValue | EXIF | 3 | 0 | 3 | 0 | 1 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:MetadataEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:MeteringMode | EXIF | 3 | 3 | 0 | 0 | 1 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:Model | EXIF | 4 | 1 | 3 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:NoiseReduction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:OECF | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:OffsetTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:OffsetTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:OffsetTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:Orientation | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:Photographer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:PhotometricInterpretation | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:PixelXDimension | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:PixelYDimension | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
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
| OLYMPUS IMAGING CORP. | EXIF:ResolutionUnit | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:RowsPerStrip | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:SamplesPerPixel | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:Saturation | EXIF | 3 | 3 | 0 | 0 | 1 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:SceneCaptureType | EXIF | 3 | 3 | 0 | 0 | 1 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:SceneType | EXIF | 0 | 0 | 0 | 0 | 1 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:SensingMethod | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:SensitivityType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:ShadingCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:Sharpness | EXIF | 3 | 3 | 0 | 0 | 1 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:ShutterSpeedValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:Software | EXIF | 4 | 1 | 3 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:SourceExposureTimesOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:SourceImageNumberOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:SpatialFrequencyResponse | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:SpectralSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:StandardOutputSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:StripByteCounts | EXIF | 1 | 0 | 0 | 0 | 0 | 0 | 1 |
| OLYMPUS IMAGING CORP. | EXIF:StripOffsets | EXIF | 1 | 0 | 0 | 0 | 0 | 0 | 1 |
| OLYMPUS IMAGING CORP. | EXIF:SubjectArea | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:SubjectDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:SubjectDistanceRange | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:SubjectLocation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:SubSecTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:SubSecTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:SubSecTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:Temperature | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:TransferFunction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:UserComment | EXIF | 3 | 0 | 3 | 0 | 1 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:WaterDepth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:WhiteBalance | EXIF | 3 | 3 | 0 | 0 | 1 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:WhitePoint | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:XResolution | EXIF | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:YCbCrCoefficients | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:YCbCrPositioning | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:YCbCrSubSampling | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OLYMPUS IMAGING CORP. | EXIF:YResolution | EXIF | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
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
| Panasonic | block:EXIF | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | block:ICC | ICC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | block:IPTC | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | block:JFIF | JFIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | block:XMP | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | DIMENSIONS:height | DIMENSIONS | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | DIMENSIONS:width | DIMENSIONS | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
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
| Panasonic | EXIF:ColorSpace | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:ComponentsConfiguration | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:CompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:CompressedBitsPerPixel | EXIF | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:Compression | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:Contrast | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:Copyright | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:CustomRendered | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:DateTime | EXIF | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:DateTimeDigitized | EXIF | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:DateTimeOriginal | EXIF | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:DevelopmentType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:DevelopmentTypeDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:DeviceSettingDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:DigitalZoomRatio | EXIF | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:DistortionCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:ExifIFDPointer | EXIF | 3 | 0 | 0 | 0 | 0 | 3 | 0 |
| Panasonic | EXIF:ExifVersion | EXIF | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:ExposureBiasValue | EXIF | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:ExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:ExposureMode | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:ExposureProgram | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:ExposureTime | EXIF | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:FileSource | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:Flash | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:FlashEnergy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:FlashpixVersion | EXIF | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:FNumber | EXIF | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:FocalLength | EXIF | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:FocalLengthIn35mmFilm | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:FocalPlaneResolutionUnit | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:FocalPlaneXResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:FocalPlaneYResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:GainControl | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
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
| Panasonic | EXIF:InteroperabilityIFDPointer | EXIF | 3 | 0 | 0 | 0 | 0 | 3 | 0 |
| Panasonic | EXIF:InteroperabilityIndex | EXIF | 3 | 0 | 0 | 0 | 0 | 3 | 0 |
| Panasonic | EXIF:InteroperabilityVersion | EXIF | 3 | 0 | 0 | 0 | 0 | 3 | 0 |
| Panasonic | EXIF:ISOSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:ISOSpeedLatitudeyyy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:ISOSpeedLatitudezzz | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:ISOSpeedRatings | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:JPEGInterchangeFormat | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:JPEGInterchangeFormatLength | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:LearningOptOutIn | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:LensMake | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:LensModel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:LensSerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:LensSpecification | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:LightSource | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:Make | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:MakerNote | EXIF | 3 | 0 | 0 | 0 | 0 | 3 | 0 |
| Panasonic | EXIF:MaxApertureValue | EXIF | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:MetadataEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:MeteringMode | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:Model | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:NoiseReduction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:OECF | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:OffsetTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:OffsetTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:OffsetTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:Orientation | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:Photographer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:PhotometricInterpretation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:PixelXDimension | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:PixelYDimension | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
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
| Panasonic | EXIF:ResolutionUnit | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:RowsPerStrip | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:SamplesPerPixel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:Saturation | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:SceneCaptureType | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:SceneType | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:SensingMethod | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:SensitivityType | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:ShadingCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:Sharpness | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:ShutterSpeedValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:Software | EXIF | 3 | 2 | 1 | 0 | 0 | 0 | 0 |
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
| Panasonic | EXIF:SubSecTime | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:SubSecTimeDigitized | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:SubSecTimeOriginal | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:Temperature | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:TransferFunction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:UserComment | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:WaterDepth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:WhiteBalance | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:WhitePoint | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:XResolution | EXIF | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:YCbCrCoefficients | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:YCbCrPositioning | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:YCbCrSubSampling | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Panasonic | EXIF:YResolution | EXIF | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
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
| PENTAX Corporation | block:EXIF | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | block:ICC | ICC | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | block:IPTC | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | block:JFIF | JFIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | block:XMP | XMP | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | DIMENSIONS:height | DIMENSIONS | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | DIMENSIONS:width | DIMENSIONS | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
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
| PENTAX Corporation | EXIF:ColorSpace | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:ComponentsConfiguration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:CompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:CompressedBitsPerPixel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:Compression | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:Contrast | EXIF | 0 | 0 | 0 | 0 | 2 | 0 | 0 |
| PENTAX Corporation | EXIF:Copyright | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:CustomRendered | EXIF | 0 | 0 | 0 | 0 | 2 | 0 | 0 |
| PENTAX Corporation | EXIF:DateTime | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:DateTimeDigitized | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:DateTimeOriginal | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:DevelopmentType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:DevelopmentTypeDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:DeviceSettingDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:DigitalZoomRatio | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:DistortionCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:ExifIFDPointer | EXIF | 2 | 0 | 0 | 0 | 0 | 2 | 0 |
| PENTAX Corporation | EXIF:ExifVersion | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:ExposureBiasValue | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:ExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:ExposureMode | EXIF | 0 | 0 | 0 | 0 | 2 | 0 | 0 |
| PENTAX Corporation | EXIF:ExposureProgram | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:ExposureTime | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:FileSource | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:Flash | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:FlashEnergy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:FlashpixVersion | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:FNumber | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:FocalLength | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
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
| PENTAX Corporation | EXIF:ISOSpeedRatings | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:JPEGInterchangeFormat | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:JPEGInterchangeFormatLength | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:LearningOptOutIn | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:LensMake | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:LensModel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:LensSerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:LensSpecification | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:LightSource | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:Make | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:MakerNote | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:MaxApertureValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:MetadataEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:MeteringMode | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:Model | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:NoiseReduction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:OECF | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:OffsetTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:OffsetTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:OffsetTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:Orientation | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:Photographer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:PhotometricInterpretation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:PixelXDimension | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:PixelYDimension | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
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
| PENTAX Corporation | EXIF:ResolutionUnit | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:RowsPerStrip | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:SamplesPerPixel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:Saturation | EXIF | 0 | 0 | 0 | 0 | 2 | 0 | 0 |
| PENTAX Corporation | EXIF:SceneCaptureType | EXIF | 0 | 0 | 0 | 0 | 2 | 0 | 0 |
| PENTAX Corporation | EXIF:SceneType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:SensingMethod | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:SensitivityType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:ShadingCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:Sharpness | EXIF | 0 | 0 | 0 | 0 | 2 | 0 | 0 |
| PENTAX Corporation | EXIF:ShutterSpeedValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:Software | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:SourceExposureTimesOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:SourceImageNumberOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:SpatialFrequencyResponse | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:SpectralSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:StandardOutputSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:StripByteCounts | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:StripOffsets | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:SubjectArea | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:SubjectDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:SubjectDistanceRange | EXIF | 0 | 0 | 0 | 0 | 2 | 0 | 0 |
| PENTAX Corporation | EXIF:SubjectLocation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:SubSecTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:SubSecTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:SubSecTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:Temperature | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:TransferFunction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:UserComment | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:WaterDepth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:WhiteBalance | EXIF | 0 | 0 | 0 | 0 | 2 | 0 | 0 |
| PENTAX Corporation | EXIF:WhitePoint | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:XResolution | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:YCbCrCoefficients | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:YCbCrPositioning | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:YCbCrSubSampling | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | EXIF:YResolution | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | IPTC:Byline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | IPTC:Caption | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | IPTC:City | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | IPTC:CopyrightNotice | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | IPTC:CountryCode | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | IPTC:DateCreated | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | IPTC:Headline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | IPTC:Keywords | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | IPTC:ObjectName | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | XMP:XMP-dc:Creator | XMP | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | XMP:XMP-dc:Description | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | XMP:XMP-dc:Title | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PENTAX Corporation | XMP:XMP-xmp:CreateDate | XMP | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
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
| samsung | block:EXIF | EXIF | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| samsung | block:ICC | ICC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | block:IPTC | IPTC | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| samsung | block:JFIF | JFIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| samsung | block:XMP | XMP | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| samsung | DIMENSIONS:height | DIMENSIONS | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| samsung | DIMENSIONS:width | DIMENSIONS | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:Acceleration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:ApertureValue | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| samsung | EXIF:Artist | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:BitsPerSample | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:BodySerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:BrightnessValue | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| samsung | EXIF:CameraElevationAngle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:CameraFirmware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:CameraOwnerName | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:CFAPattern | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:ChromaticAberrationCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:ColorSpace | EXIF | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:ComponentsConfiguration | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:CompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:CompressedBitsPerPixel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:Compression | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:Contrast | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:Copyright | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:CustomRendered | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:DateTime | EXIF | 5 | 0 | 5 | 0 | 0 | 0 | 0 |
| samsung | EXIF:DateTimeDigitized | EXIF | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| samsung | EXIF:DateTimeOriginal | EXIF | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| samsung | EXIF:DevelopmentType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:DevelopmentTypeDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:DeviceSettingDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:DigitalZoomRatio | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:DistortionCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:ExifIFDPointer | EXIF | 5 | 0 | 0 | 0 | 0 | 5 | 0 |
| samsung | EXIF:ExifVersion | EXIF | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| samsung | EXIF:ExposureBiasValue | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| samsung | EXIF:ExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:ExposureMode | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:ExposureProgram | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:ExposureTime | EXIF | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| samsung | EXIF:FileSource | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:Flash | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:FlashEnergy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:FlashpixVersion | EXIF | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| samsung | EXIF:FNumber | EXIF | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| samsung | EXIF:FocalLength | EXIF | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| samsung | EXIF:FocalLengthIn35mmFilm | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:FocalPlaneResolutionUnit | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:FocalPlaneXResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:FocalPlaneYResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:GainControl | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:Gamma | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:GPSAltitude | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| samsung | EXIF:GPSAltitudeRef | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:GPSAreaInformation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:GPSDateStamp | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
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
| samsung | EXIF:GPSInfoIFDPointer | EXIF | 4 | 0 | 0 | 0 | 0 | 4 | 0 |
| samsung | EXIF:GPSLatitude | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:GPSLatitudeRef | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:GPSLongitude | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:GPSLongitudeRef | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:GPSMapDatum | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:GPSMeasureMode | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:GPSProcessingMethod | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:GPSSatellites | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:GPSSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:GPSSpeedRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:GPSStatus | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:GPSTimeStamp | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| samsung | EXIF:GPSTrack | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:GPSTrackRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:GPSVersionID | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:Humidity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:ImageDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:ImageEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:ImageEditor | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:ImageLength | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:ImageTitle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:ImageUniqueID | EXIF | 4 | 3 | 1 | 0 | 0 | 0 | 0 |
| samsung | EXIF:ImageWidth | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:InteroperabilityIFDPointer | EXIF | 2 | 0 | 0 | 0 | 0 | 2 | 0 |
| samsung | EXIF:InteroperabilityIndex | EXIF | 2 | 0 | 0 | 0 | 0 | 2 | 0 |
| samsung | EXIF:InteroperabilityVersion | EXIF | 2 | 0 | 0 | 0 | 0 | 2 | 0 |
| samsung | EXIF:ISOSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:ISOSpeedLatitudeyyy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:ISOSpeedLatitudezzz | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:ISOSpeedRatings | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:JPEGInterchangeFormat | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:JPEGInterchangeFormatLength | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:LearningOptOutIn | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:LensMake | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:LensModel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:LensSerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:LensSpecification | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:LightSource | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:Make | EXIF | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:MakerNote | EXIF | 3 | 0 | 0 | 0 | 0 | 3 | 0 |
| samsung | EXIF:MaxApertureValue | EXIF | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| samsung | EXIF:MetadataEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:MeteringMode | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:Model | EXIF | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:NoiseReduction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:OECF | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:OffsetTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:OffsetTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:OffsetTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:Orientation | EXIF | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:Photographer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:PhotometricInterpretation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:PixelXDimension | EXIF | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:PixelYDimension | EXIF | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
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
| samsung | EXIF:ResolutionUnit | EXIF | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:RowsPerStrip | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:SamplesPerPixel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:Saturation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:SceneCaptureType | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:SceneType | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:SensingMethod | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:SensitivityType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:ShadingCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:Sharpness | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:ShutterSpeedValue | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| samsung | EXIF:Software | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
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
| samsung | EXIF:SubSecTime | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:SubSecTimeDigitized | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:SubSecTimeOriginal | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:Temperature | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:TransferFunction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:UserComment | EXIF | 2 | 0 | 0 | 0 | 0 | 2 | 0 |
| samsung | EXIF:WaterDepth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:WhiteBalance | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:WhitePoint | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:XResolution | EXIF | 5 | 0 | 5 | 0 | 0 | 0 | 0 |
| samsung | EXIF:YCbCrCoefficients | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:YCbCrPositioning | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:YCbCrSubSampling | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| samsung | EXIF:YResolution | EXIF | 5 | 0 | 5 | 0 | 0 | 0 | 0 |
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
| Samsung | block:EXIF | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Samsung | block:ICC | ICC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | block:IPTC | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | block:JFIF | JFIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | block:XMP | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | DIMENSIONS:height | DIMENSIONS | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Samsung | DIMENSIONS:width | DIMENSIONS | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:Acceleration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:ApertureValue | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:Artist | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:BitsPerSample | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:BodySerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:BrightnessValue | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:CameraElevationAngle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:CameraFirmware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:CameraOwnerName | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:CFAPattern | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:ChromaticAberrationCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:ColorSpace | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:ComponentsConfiguration | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:CompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:CompressedBitsPerPixel | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:Compression | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:Contrast | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:Copyright | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:CustomRendered | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:DateTime | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:DateTimeDigitized | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:DateTimeOriginal | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:DevelopmentType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:DevelopmentTypeDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:DeviceSettingDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:DigitalZoomRatio | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:DistortionCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:ExifIFDPointer | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| Samsung | EXIF:ExifVersion | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:ExposureBiasValue | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:ExposureIndex | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| Samsung | EXIF:ExposureMode | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:ExposureProgram | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:ExposureTime | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:FileSource | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:Flash | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:FlashEnergy | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:FlashpixVersion | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| Samsung | EXIF:FNumber | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:FocalLength | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:FocalLengthIn35mmFilm | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:FocalPlaneResolutionUnit | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:FocalPlaneXResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:FocalPlaneYResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:GainControl | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:Gamma | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:GPSAltitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:GPSAltitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:GPSAreaInformation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:GPSDateStamp | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:GPSDestBearing | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:GPSDestBearingRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:GPSDestDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:GPSDestDistanceRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:GPSDestLatitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:GPSDestLatitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:GPSDestLongitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:GPSDestLongitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:GPSDifferential | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:GPSDOP | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:GPSHPositioningError | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:GPSImgDirection | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:GPSImgDirectionRef | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:GPSInfoIFDPointer | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| Samsung | EXIF:GPSLatitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:GPSLatitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:GPSLongitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:GPSLongitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:GPSMapDatum | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:GPSMeasureMode | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:GPSProcessingMethod | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:GPSSatellites | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:GPSSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:GPSSpeedRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:GPSStatus | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:GPSTimeStamp | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:GPSTrack | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:GPSTrackRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:GPSVersionID | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:Humidity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:ImageDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:ImageEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:ImageEditor | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:ImageLength | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:ImageTitle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:ImageUniqueID | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:ImageWidth | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:InteroperabilityIFDPointer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:InteroperabilityIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:InteroperabilityVersion | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:ISOSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:ISOSpeedLatitudeyyy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:ISOSpeedLatitudezzz | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:ISOSpeedRatings | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:JPEGInterchangeFormat | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:JPEGInterchangeFormatLength | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:LearningOptOutIn | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:LensMake | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:LensModel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:LensSerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:LensSpecification | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:LightSource | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:Make | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:MakerNote | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:MaxApertureValue | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:MetadataEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:MeteringMode | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:Model | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:NoiseReduction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:OECF | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:OffsetTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:OffsetTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:OffsetTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:Orientation | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:Photographer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:PhotometricInterpretation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:PixelXDimension | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:PixelYDimension | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:PlanarConfiguration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:Pressure | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:PrimaryChromaticities | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:RAWDevelopingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:RecommendedExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:ReferenceBlackWhite | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:RelatedImageFileFormat | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:RelatedImageLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:RelatedImageWidth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:RelatedSoundFile | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:ResolutionUnit | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:RowsPerStrip | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:SamplesPerPixel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:Saturation | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:SceneCaptureType | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:SceneType | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:SensingMethod | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:SensitivityType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:ShadingCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:Sharpness | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:ShutterSpeedValue | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:Software | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:SourceExposureTimesOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:SourceImageNumberOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:SpatialFrequencyResponse | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:SpectralSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:StandardOutputSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:StripByteCounts | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:StripOffsets | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:SubjectArea | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:SubjectDistance | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:SubjectDistanceRange | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:SubjectLocation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:SubSecTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:SubSecTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:SubSecTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:Temperature | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:TransferFunction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:UserComment | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:WaterDepth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:WhiteBalance | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:WhitePoint | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:XResolution | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:YCbCrCoefficients | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:YCbCrPositioning | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:YCbCrSubSampling | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | EXIF:YResolution | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| Samsung | IPTC:Byline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | IPTC:Caption | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | IPTC:City | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | IPTC:CopyrightNotice | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | IPTC:CountryCode | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | IPTC:DateCreated | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | IPTC:Headline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | IPTC:Keywords | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | IPTC:ObjectName | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | XMP:XMP-dc:Creator | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | XMP:XMP-dc:Description | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | XMP:XMP-dc:Title | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung | XMP:XMP-xmp:CreateDate | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | block:EXIF | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | block:ICC | ICC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | block:IPTC | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | block:JFIF | JFIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | block:XMP | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | DIMENSIONS:height | DIMENSIONS | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | DIMENSIONS:width | DIMENSIONS | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:Acceleration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:ApertureValue | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:Artist | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:BitsPerSample | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:BodySerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:BrightnessValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:CameraElevationAngle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:CameraFirmware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:CameraOwnerName | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:CFAPattern | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:ChromaticAberrationCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:ColorSpace | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:ComponentsConfiguration | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:CompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:CompressedBitsPerPixel | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:Compression | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:Contrast | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:Copyright | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:CustomRendered | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:DateTime | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:DateTimeDigitized | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:DateTimeOriginal | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:DevelopmentType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:DevelopmentTypeDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:DeviceSettingDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:DigitalZoomRatio | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:DistortionCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:ExifIFDPointer | EXIF | 2 | 0 | 0 | 0 | 0 | 2 | 0 |
| Samsung Techwin | EXIF:ExifVersion | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:ExposureBiasValue | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:ExposureIndex | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:ExposureMode | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:ExposureProgram | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:ExposureTime | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:FileSource | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:Flash | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:FlashEnergy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:FlashpixVersion | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:FNumber | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:FocalLength | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:FocalLengthIn35mmFilm | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
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
| Samsung Techwin | EXIF:ImageDescription | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:ImageEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:ImageEditor | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:ImageLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:ImageTitle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:ImageUniqueID | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:ImageWidth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:InteroperabilityIFDPointer | EXIF | 2 | 0 | 0 | 0 | 0 | 2 | 0 |
| Samsung Techwin | EXIF:InteroperabilityIndex | EXIF | 2 | 0 | 0 | 0 | 0 | 2 | 0 |
| Samsung Techwin | EXIF:InteroperabilityVersion | EXIF | 2 | 0 | 0 | 0 | 0 | 2 | 0 |
| Samsung Techwin | EXIF:ISOSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:ISOSpeedLatitudeyyy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:ISOSpeedLatitudezzz | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:ISOSpeedRatings | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:JPEGInterchangeFormat | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:JPEGInterchangeFormatLength | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:LearningOptOutIn | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:LensMake | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:LensModel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:LensSerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:LensSpecification | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:LightSource | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:Make | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:MakerNote | EXIF | 2 | 0 | 0 | 0 | 0 | 2 | 0 |
| Samsung Techwin | EXIF:MaxApertureValue | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:MetadataEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:MeteringMode | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:Model | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:NoiseReduction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:OECF | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:OffsetTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:OffsetTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:OffsetTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:Orientation | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:Photographer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:PhotometricInterpretation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:PixelXDimension | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:PixelYDimension | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:PlanarConfiguration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:Pressure | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:PrimaryChromaticities | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:RAWDevelopingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:RecommendedExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:ReferenceBlackWhite | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:RelatedImageFileFormat | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:RelatedImageLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:RelatedImageWidth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:RelatedSoundFile | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:ResolutionUnit | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:RowsPerStrip | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:SamplesPerPixel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:Saturation | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:SceneCaptureType | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:SceneType | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:SensingMethod | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:SensitivityType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:ShadingCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:Sharpness | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:ShutterSpeedValue | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:Software | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
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
| Samsung Techwin | EXIF:WhiteBalance | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:WhitePoint | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:XResolution | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:YCbCrCoefficients | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:YCbCrPositioning | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:YCbCrSubSampling | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Samsung Techwin | EXIF:YResolution | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
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
| SONY | block:EXIF | EXIF | 11 | 11 | 0 | 0 | 0 | 0 | 0 |
| SONY | block:ICC | ICC | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| SONY | block:IPTC | IPTC | 3 | 2 | 0 | 0 | 0 | 1 | 0 |
| SONY | block:JFIF | JFIF | 6 | 6 | 0 | 0 | 0 | 0 | 0 |
| SONY | block:XMP | XMP | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| SONY | DIMENSIONS:height | DIMENSIONS | 11 | 11 | 0 | 0 | 0 | 0 | 0 |
| SONY | DIMENSIONS:width | DIMENSIONS | 11 | 11 | 0 | 0 | 0 | 0 | 0 |
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
| SONY | EXIF:ColorSpace | EXIF | 11 | 11 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:ComponentsConfiguration | EXIF | 11 | 11 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:CompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:CompressedBitsPerPixel | EXIF | 11 | 0 | 11 | 0 | 0 | 0 | 0 |
| SONY | EXIF:Compression | EXIF | 10 | 10 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:Contrast | EXIF | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:Copyright | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:CustomRendered | EXIF | 8 | 8 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:DateTime | EXIF | 11 | 0 | 11 | 0 | 0 | 0 | 0 |
| SONY | EXIF:DateTimeDigitized | EXIF | 11 | 0 | 11 | 0 | 0 | 0 | 0 |
| SONY | EXIF:DateTimeOriginal | EXIF | 11 | 0 | 11 | 0 | 0 | 0 | 0 |
| SONY | EXIF:DevelopmentType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:DevelopmentTypeDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:DeviceSettingDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:DigitalZoomRatio | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| SONY | EXIF:DistortionCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:ExifIFDPointer | EXIF | 11 | 0 | 0 | 0 | 0 | 11 | 0 |
| SONY | EXIF:ExifVersion | EXIF | 11 | 0 | 11 | 0 | 0 | 0 | 0 |
| SONY | EXIF:ExposureBiasValue | EXIF | 11 | 0 | 11 | 0 | 0 | 0 | 0 |
| SONY | EXIF:ExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:ExposureMode | EXIF | 8 | 8 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:ExposureProgram | EXIF | 11 | 11 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:ExposureTime | EXIF | 10 | 0 | 10 | 0 | 0 | 0 | 0 |
| SONY | EXIF:FileSource | EXIF | 10 | 10 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:Flash | EXIF | 11 | 11 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:FlashEnergy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:FlashpixVersion | EXIF | 11 | 0 | 11 | 0 | 0 | 0 | 0 |
| SONY | EXIF:FNumber | EXIF | 10 | 0 | 10 | 0 | 0 | 0 | 0 |
| SONY | EXIF:FocalLength | EXIF | 10 | 0 | 10 | 0 | 0 | 0 | 0 |
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
| SONY | EXIF:ImageDescription | EXIF | 8 | 8 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:ImageEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:ImageEditor | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:ImageLength | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:ImageTitle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:ImageUniqueID | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:ImageWidth | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:InteroperabilityIFDPointer | EXIF | 9 | 0 | 0 | 0 | 0 | 9 | 0 |
| SONY | EXIF:InteroperabilityIndex | EXIF | 9 | 0 | 0 | 0 | 0 | 9 | 0 |
| SONY | EXIF:InteroperabilityVersion | EXIF | 9 | 0 | 0 | 0 | 0 | 9 | 0 |
| SONY | EXIF:ISOSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:ISOSpeedLatitudeyyy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:ISOSpeedLatitudezzz | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:ISOSpeedRatings | EXIF | 9 | 9 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:JPEGInterchangeFormat | EXIF | 9 | 9 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:JPEGInterchangeFormatLength | EXIF | 9 | 9 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:LearningOptOutIn | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:LensMake | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:LensModel | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:LensSerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:LensSpecification | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| SONY | EXIF:LightSource | EXIF | 10 | 10 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:Make | EXIF | 11 | 10 | 1 | 0 | 0 | 0 | 0 |
| SONY | EXIF:MakerNote | EXIF | 6 | 0 | 0 | 0 | 0 | 6 | 0 |
| SONY | EXIF:MaxApertureValue | EXIF | 10 | 0 | 10 | 0 | 0 | 0 | 0 |
| SONY | EXIF:MetadataEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:MeteringMode | EXIF | 11 | 11 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:Model | EXIF | 11 | 11 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:NoiseReduction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:OECF | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:OffsetTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:OffsetTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:OffsetTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:Orientation | EXIF | 10 | 10 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:Photographer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:PhotometricInterpretation | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:PixelXDimension | EXIF | 11 | 11 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:PixelYDimension | EXIF | 11 | 11 | 0 | 0 | 0 | 0 | 0 |
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
| SONY | EXIF:ResolutionUnit | EXIF | 11 | 11 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:RowsPerStrip | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:SamplesPerPixel | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:Saturation | EXIF | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:SceneCaptureType | EXIF | 8 | 8 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:SceneType | EXIF | 10 | 10 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:SensingMethod | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:SensitivityType | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:ShadingCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:Sharpness | EXIF | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:ShutterSpeedValue | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| SONY | EXIF:Software | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
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
| SONY | EXIF:UserComment | EXIF | 1 | 0 | 0 | 0 | 1 | 1 | 0 |
| SONY | EXIF:WaterDepth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:WhiteBalance | EXIF | 8 | 8 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:WhitePoint | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:XResolution | EXIF | 11 | 0 | 11 | 0 | 0 | 0 | 0 |
| SONY | EXIF:YCbCrCoefficients | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:YCbCrPositioning | EXIF | 11 | 11 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:YCbCrSubSampling | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | EXIF:YResolution | EXIF | 11 | 0 | 11 | 0 | 0 | 0 | 0 |
| SONY | IPTC:Byline | IPTC | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| SONY | IPTC:Caption | IPTC | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| SONY | IPTC:City | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | IPTC:CopyrightNotice | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | IPTC:CountryCode | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | IPTC:DateCreated | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | IPTC:Headline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | IPTC:Keywords | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | IPTC:ObjectName | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | XMP:XMP-dc:Creator | XMP | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| SONY | XMP:XMP-dc:Description | XMP | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| SONY | XMP:XMP-dc:Title | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY | XMP:XMP-xmp:CreateDate | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | block:EXIF | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | block:ICC | ICC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | block:IPTC | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | block:JFIF | JFIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | block:XMP | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | DIMENSIONS:height | DIMENSIONS | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | DIMENSIONS:width | DIMENSIONS | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:Acceleration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:ApertureValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:Artist | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:BitsPerSample | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:BodySerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:BrightnessValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:CameraElevationAngle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:CameraFirmware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:CameraOwnerName | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:CFAPattern | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:ChromaticAberrationCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:ColorSpace | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:ComponentsConfiguration | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:CompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:CompressedBitsPerPixel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:Compression | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:Contrast | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:Copyright | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:CustomRendered | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:DateTime | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:DateTimeDigitized | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:DateTimeOriginal | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:DevelopmentType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:DevelopmentTypeDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:DeviceSettingDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:DigitalZoomRatio | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:DistortionCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:ExifIFDPointer | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| SONY ERICSSON | EXIF:ExifVersion | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:ExposureBiasValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:ExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:ExposureMode | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:ExposureProgram | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:ExposureTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:FileSource | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:Flash | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:FlashEnergy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:FlashpixVersion | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:FNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:FocalLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:FocalLengthIn35mmFilm | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:FocalPlaneResolutionUnit | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:FocalPlaneXResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:FocalPlaneYResolution | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:GainControl | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:Gamma | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:GPSAltitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:GPSAltitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:GPSAreaInformation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:GPSDateStamp | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:GPSDestBearing | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:GPSDestBearingRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:GPSDestDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:GPSDestDistanceRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:GPSDestLatitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:GPSDestLatitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:GPSDestLongitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:GPSDestLongitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:GPSDifferential | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:GPSDOP | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:GPSHPositioningError | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:GPSImgDirection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:GPSImgDirectionRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:GPSInfoIFDPointer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:GPSLatitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:GPSLatitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:GPSLongitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:GPSLongitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:GPSMapDatum | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:GPSMeasureMode | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:GPSProcessingMethod | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:GPSSatellites | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:GPSSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:GPSSpeedRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:GPSStatus | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:GPSTimeStamp | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:GPSTrack | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:GPSTrackRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:GPSVersionID | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:Humidity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:ImageDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:ImageEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:ImageEditor | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:ImageLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:ImageTitle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:ImageUniqueID | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:ImageWidth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:InteroperabilityIFDPointer | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| SONY ERICSSON | EXIF:InteroperabilityIndex | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| SONY ERICSSON | EXIF:InteroperabilityVersion | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| SONY ERICSSON | EXIF:ISOSpeed | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:ISOSpeedLatitudeyyy | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:ISOSpeedLatitudezzz | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:ISOSpeedRatings | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:JPEGInterchangeFormat | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:JPEGInterchangeFormatLength | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:LearningOptOutIn | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:LensMake | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:LensModel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:LensSerialNumber | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:LensSpecification | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:LightSource | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:Make | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:MakerNote | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:MaxApertureValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:MetadataEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:MeteringMode | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:Model | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:NoiseReduction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:OECF | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:OffsetTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:OffsetTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:OffsetTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:Orientation | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:Photographer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:PhotometricInterpretation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:PixelXDimension | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:PixelYDimension | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:PlanarConfiguration | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:Pressure | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:PrimaryChromaticities | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:RAWDevelopingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:RecommendedExposureIndex | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:ReferenceBlackWhite | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:RelatedImageFileFormat | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:RelatedImageLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:RelatedImageWidth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:RelatedSoundFile | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:ResolutionUnit | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:RowsPerStrip | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:SamplesPerPixel | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:Saturation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:SceneCaptureType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:SceneType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:SensingMethod | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:SensitivityType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:ShadingCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:Sharpness | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:ShutterSpeedValue | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:Software | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:SourceExposureTimesOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:SourceImageNumberOfCompositeImage | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:SpatialFrequencyResponse | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:SpectralSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:StandardOutputSensitivity | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:StripByteCounts | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:StripOffsets | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:SubjectArea | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:SubjectDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:SubjectDistanceRange | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:SubjectLocation | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:SubSecTime | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:SubSecTimeDigitized | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:SubSecTimeOriginal | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:Temperature | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:TransferFunction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:UserComment | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:WaterDepth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:WhiteBalance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:WhitePoint | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:XResolution | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:YCbCrCoefficients | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:YCbCrPositioning | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:YCbCrSubSampling | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | EXIF:YResolution | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | IPTC:Byline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | IPTC:Caption | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | IPTC:City | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | IPTC:CopyrightNotice | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | IPTC:CountryCode | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | IPTC:DateCreated | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | IPTC:Headline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | IPTC:Keywords | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | IPTC:ObjectName | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | XMP:XMP-dc:Creator | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | XMP:XMP-dc:Description | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | XMP:XMP-dc:Title | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SONY ERICSSON | XMP:XMP-xmp:CreateDate | XMP | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | block:EXIF | EXIF | 233 | 228 | 0 | 0 | 0 | 2 | 3 |
| unknown | block:ICC | ICC | 122 | 38 | 0 | 0 | 0 | 83 | 1 |
| unknown | block:IPTC | IPTC | 19 | 7 | 0 | 0 | 0 | 12 | 0 |
| unknown | block:JFIF | JFIF | 154 | 153 | 0 | 0 | 0 | 1 | 0 |
| unknown | block:XMP | XMP | 43 | 42 | 0 | 0 | 0 | 0 | 1 |
| unknown | DIMENSIONS:height | DIMENSIONS | 996 | 431 | 0 | 0 | 27 | 565 | 0 |
| unknown | DIMENSIONS:width | DIMENSIONS | 996 | 431 | 0 | 0 | 27 | 565 | 0 |
| unknown | EXIF:Acceleration | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| unknown | EXIF:ApertureValue | EXIF | 1 | 0 | 0 | 0 | 0 | 0 | 1 |
| unknown | EXIF:Artist | EXIF | 6 | 6 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:BitsPerSample | EXIF | 164 | 71 | 93 | 0 | 0 | 0 | 0 |
| unknown | EXIF:BodySerialNumber | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:BrightnessValue | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| unknown | EXIF:CameraElevationAngle | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| unknown | EXIF:CameraFirmware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:CameraOwnerName | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| unknown | EXIF:CFAPattern | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| unknown | EXIF:ChromaticAberrationCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:ColorSpace | EXIF | 20 | 20 | 0 | 0 | 1 | 0 | 0 |
| unknown | EXIF:ComponentsConfiguration | EXIF | 5 | 5 | 0 | 0 | 1 | 0 | 0 |
| unknown | EXIF:CompositeImage | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:CompressedBitsPerPixel | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| unknown | EXIF:Compression | EXIF | 169 | 169 | 0 | 0 | 1 | 0 | 0 |
| unknown | EXIF:Contrast | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:Copyright | EXIF | 14 | 14 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:CustomRendered | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:DateTime | EXIF | 30 | 1 | 29 | 0 | 1 | 0 | 0 |
| unknown | EXIF:DateTimeDigitized | EXIF | 9 | 1 | 8 | 0 | 0 | 0 | 0 |
| unknown | EXIF:DateTimeOriginal | EXIF | 9 | 1 | 8 | 0 | 2 | 0 | 0 |
| unknown | EXIF:DevelopmentType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:DevelopmentTypeDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:DeviceSettingDescription | EXIF | 1 | 0 | 0 | 0 | 0 | 0 | 1 |
| unknown | EXIF:DigitalZoomRatio | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| unknown | EXIF:DistortionCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:ExifIFDPointer | EXIF | 57 | 0 | 0 | 0 | 0 | 57 | 0 |
| unknown | EXIF:ExifVersion | EXIF | 18 | 0 | 18 | 0 | 1 | 0 | 0 |
| unknown | EXIF:ExposureBiasValue | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| unknown | EXIF:ExposureIndex | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| unknown | EXIF:ExposureMode | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:ExposureProgram | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:ExposureTime | EXIF | 5 | 0 | 5 | 0 | 0 | 0 | 0 |
| unknown | EXIF:FileSource | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:Flash | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:FlashEnergy | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| unknown | EXIF:FlashpixVersion | EXIF | 6 | 0 | 6 | 0 | 1 | 0 | 0 |
| unknown | EXIF:FNumber | EXIF | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| unknown | EXIF:FocalLength | EXIF | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| unknown | EXIF:FocalLengthIn35mmFilm | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:FocalPlaneResolutionUnit | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:FocalPlaneXResolution | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| unknown | EXIF:FocalPlaneYResolution | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| unknown | EXIF:GainControl | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| unknown | EXIF:Gamma | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| unknown | EXIF:GPSAltitude | EXIF | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| unknown | EXIF:GPSAltitudeRef | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:GPSAreaInformation | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| unknown | EXIF:GPSDateStamp | EXIF | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| unknown | EXIF:GPSDestBearing | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:GPSDestBearingRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:GPSDestDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:GPSDestDistanceRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:GPSDestLatitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:GPSDestLatitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:GPSDestLongitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:GPSDestLongitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:GPSDifferential | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:GPSDOP | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:GPSHPositioningError | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| unknown | EXIF:GPSImgDirection | EXIF | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| unknown | EXIF:GPSImgDirectionRef | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:GPSInfoIFDPointer | EXIF | 3 | 0 | 0 | 0 | 0 | 3 | 0 |
| unknown | EXIF:GPSLatitude | EXIF | 3 | 2 | 1 | 0 | 0 | 0 | 0 |
| unknown | EXIF:GPSLatitudeRef | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:GPSLongitude | EXIF | 3 | 2 | 1 | 0 | 0 | 0 | 0 |
| unknown | EXIF:GPSLongitudeRef | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:GPSMapDatum | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:GPSMeasureMode | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:GPSProcessingMethod | EXIF | 3 | 2 | 1 | 0 | 0 | 0 | 0 |
| unknown | EXIF:GPSSatellites | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:GPSSpeed | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| unknown | EXIF:GPSSpeedRef | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:GPSStatus | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:GPSTimeStamp | EXIF | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| unknown | EXIF:GPSTrack | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:GPSTrackRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:GPSVersionID | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:Humidity | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| unknown | EXIF:ImageDescription | EXIF | 23 | 23 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:ImageEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:ImageEditor | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:ImageLength | EXIF | 164 | 164 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:ImageTitle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:ImageUniqueID | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:ImageWidth | EXIF | 164 | 164 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:InteroperabilityIFDPointer | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| unknown | EXIF:InteroperabilityIndex | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| unknown | EXIF:InteroperabilityVersion | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| unknown | EXIF:ISOSpeed | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:ISOSpeedLatitudeyyy | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:ISOSpeedLatitudezzz | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:ISOSpeedRatings | EXIF | 5 | 4 | 1 | 0 | 0 | 0 | 0 |
| unknown | EXIF:JPEGInterchangeFormat | EXIF | 15 | 13 | 0 | 0 | 1 | 2 | 0 |
| unknown | EXIF:JPEGInterchangeFormatLength | EXIF | 15 | 13 | 0 | 0 | 1 | 2 | 0 |
| unknown | EXIF:LearningOptOutIn | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:LensMake | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:LensModel | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:LensSerialNumber | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:LensSpecification | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| unknown | EXIF:LightSource | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:Make | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:MakerNote | EXIF | 4 | 0 | 0 | 0 | 0 | 4 | 0 |
| unknown | EXIF:MaxApertureValue | EXIF | 1 | 0 | 0 | 0 | 0 | 0 | 1 |
| unknown | EXIF:MetadataEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:MeteringMode | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:Model | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:NoiseReduction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:OECF | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| unknown | EXIF:OffsetTime | EXIF | 9 | 9 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:OffsetTimeDigitized | EXIF | 9 | 9 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:OffsetTimeOriginal | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:Orientation | EXIF | 137 | 137 | 0 | 0 | 2 | 0 | 0 |
| unknown | EXIF:Photographer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:PhotometricInterpretation | EXIF | 162 | 162 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:PixelXDimension | EXIF | 35 | 35 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:PixelYDimension | EXIF | 35 | 35 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:PlanarConfiguration | EXIF | 143 | 143 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:Pressure | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| unknown | EXIF:PrimaryChromaticities | EXIF | 15 | 0 | 15 | 0 | 0 | 0 | 0 |
| unknown | EXIF:RAWDevelopingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:RecommendedExposureIndex | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:ReferenceBlackWhite | EXIF | 8 | 0 | 8 | 0 | 0 | 0 | 0 |
| unknown | EXIF:RelatedImageFileFormat | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:RelatedImageLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:RelatedImageWidth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:RelatedSoundFile | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:ResolutionUnit | EXIF | 143 | 143 | 0 | 0 | 3 | 0 | 0 |
| unknown | EXIF:RowsPerStrip | EXIF | 145 | 145 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:SamplesPerPixel | EXIF | 161 | 161 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:Saturation | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:SceneCaptureType | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:SceneType | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:SensingMethod | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:SensitivityType | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:ShadingCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:Sharpness | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:ShutterSpeedValue | EXIF | 1 | 0 | 0 | 0 | 0 | 0 | 1 |
| unknown | EXIF:Software | EXIF | 92 | 92 | 0 | 0 | 1 | 0 | 0 |
| unknown | EXIF:SourceExposureTimesOfCompositeImage | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| unknown | EXIF:SourceImageNumberOfCompositeImage | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| unknown | EXIF:SpatialFrequencyResponse | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| unknown | EXIF:SpectralSensitivity | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:StandardOutputSensitivity | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:StripByteCounts | EXIF | 148 | 81 | 40 | 0 | 0 | 2 | 25 |
| unknown | EXIF:StripOffsets | EXIF | 148 | 81 | 40 | 0 | 0 | 2 | 25 |
| unknown | EXIF:SubjectArea | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| unknown | EXIF:SubjectDistance | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| unknown | EXIF:SubjectDistanceRange | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:SubjectLocation | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| unknown | EXIF:SubSecTime | EXIF | 4 | 1 | 3 | 0 | 0 | 0 | 0 |
| unknown | EXIF:SubSecTimeDigitized | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:SubSecTimeOriginal | EXIF | 9 | 1 | 8 | 0 | 1 | 0 | 0 |
| unknown | EXIF:Temperature | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| unknown | EXIF:TransferFunction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:UserComment | EXIF | 5 | 0 | 4 | 0 | 0 | 1 | 0 |
| unknown | EXIF:WaterDepth | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| unknown | EXIF:WhiteBalance | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| unknown | EXIF:WhitePoint | EXIF | 15 | 0 | 15 | 0 | 0 | 0 | 0 |
| unknown | EXIF:XResolution | EXIF | 146 | 0 | 146 | 0 | 3 | 0 | 0 |
| unknown | EXIF:YCbCrCoefficients | EXIF | 5 | 0 | 5 | 0 | 0 | 0 | 0 |
| unknown | EXIF:YCbCrPositioning | EXIF | 13 | 13 | 0 | 0 | 2 | 0 | 0 |
| unknown | EXIF:YCbCrSubSampling | EXIF | 11 | 0 | 11 | 0 | 0 | 0 | 0 |
| unknown | EXIF:YResolution | EXIF | 146 | 0 | 146 | 0 | 3 | 0 | 0 |
| unknown | IPTC:Byline | IPTC | 2 | 0 | 0 | 0 | 0 | 2 | 0 |
| unknown | IPTC:Caption | IPTC | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| unknown | IPTC:City | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | IPTC:CopyrightNotice | IPTC | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| unknown | IPTC:CountryCode | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | IPTC:DateCreated | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | IPTC:Headline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| unknown | IPTC:Keywords | IPTC | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| unknown | IPTC:ObjectName | IPTC | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| unknown | XMP:XMP-dc:Creator | XMP | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| unknown | XMP:XMP-dc:Description | XMP | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| unknown | XMP:XMP-dc:Title | XMP | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| unknown | XMP:XMP-xmp:CreateDate | XMP | 27 | 0 | 27 | 0 | 5 | 0 | 0 |
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
| avif | 1229 | 776 | 315 | 0 | 2 | 138 | 0 |
| heif | 453 | 375 | 46 | 0 | 16 | 29 | 3 |
| jpeg | 6246 | 3934 | 1762 | 0 | 90 | 548 | 2 |
| png | 350 | 10 | 5 | 0 | 0 | 335 | 0 |
| tiff | 2773 | 1871 | 498 | 0 | 27 | 346 | 58 |
| unknown | 0 | 0 | 0 | 0 | 2 | 0 | 0 |
| webp | 451 | 1 | 0 | 0 | 0 | 450 | 0 |

## Per-corpus totals

| corpus | found | matched | normalized | mismatched | missing local | missing reference | non-comparable |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| ianare-exif-py | 3773 | 2302 | 1103 | 0 | 24 | 358 | 10 |
| imazen-codec-corpus | 7729 | 4665 | 1523 | 0 | 113 | 1488 | 53 |

## Per-metadata-family totals

| family | found | matched | normalized | mismatched | missing local | missing reference | non-comparable |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| DIMENSIONS | 2238 | 1104 | 0 | 0 | 54 | 1134 | 0 |
| EXIF | 8702 | 5473 | 2575 | 0 | 77 | 593 | 61 |
| ICC | 150 | 53 | 0 | 0 | 0 | 96 | 1 |
| IPTC | 59 | 33 | 4 | 0 | 0 | 22 | 0 |
| JFIF | 201 | 200 | 0 | 0 | 0 | 1 | 0 |
| XMP | 152 | 104 | 47 | 0 | 6 | 0 | 1 |

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
| imazen-codec-corpus | block:EXIF | EXIF | 258 | 255 | 0 | 0 | 0 | 2 | 1 |
| imazen-codec-corpus | block:ICC | ICC | 122 | 26 | 0 | 0 | 0 | 95 | 1 |
| imazen-codec-corpus | block:IPTC | IPTC | 21 | 6 | 0 | 0 | 0 | 15 | 0 |
| imazen-codec-corpus | block:JFIF | JFIF | 145 | 144 | 0 | 0 | 0 | 1 | 0 |
| imazen-codec-corpus | block:XMP | XMP | 48 | 47 | 0 | 0 | 0 | 0 | 1 |
| imazen-codec-corpus | DIMENSIONS:height | DIMENSIONS | 1011 | 452 | 0 | 0 | 27 | 559 | 0 |
| imazen-codec-corpus | DIMENSIONS:width | DIMENSIONS | 1011 | 452 | 0 | 0 | 27 | 559 | 0 |
| imazen-codec-corpus | EXIF:Acceleration | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:ApertureValue | EXIF | 32 | 0 | 31 | 0 | 0 | 0 | 1 |
| imazen-codec-corpus | EXIF:Artist | EXIF | 4 | 3 | 0 | 0 | 0 | 1 | 0 |
| imazen-codec-corpus | EXIF:BitsPerSample | EXIF | 157 | 71 | 86 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:BodySerialNumber | EXIF | 2 | 1 | 1 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:BrightnessValue | EXIF | 23 | 0 | 23 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:CameraElevationAngle | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:CameraFirmware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:CameraOwnerName | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| imazen-codec-corpus | EXIF:CFAPattern | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:ChromaticAberrationCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:ColorSpace | EXIF | 62 | 62 | 0 | 0 | 2 | 0 | 0 |
| imazen-codec-corpus | EXIF:ComponentsConfiguration | EXIF | 43 | 43 | 0 | 0 | 1 | 0 | 0 |
| imazen-codec-corpus | EXIF:CompositeImage | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:CompressedBitsPerPixel | EXIF | 23 | 0 | 23 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:Compression | EXIF | 200 | 200 | 0 | 0 | 1 | 0 | 0 |
| imazen-codec-corpus | EXIF:Contrast | EXIF | 32 | 32 | 0 | 0 | 2 | 0 | 0 |
| imazen-codec-corpus | EXIF:Copyright | EXIF | 17 | 15 | 2 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:CustomRendered | EXIF | 42 | 42 | 0 | 0 | 2 | 0 | 0 |
| imazen-codec-corpus | EXIF:DateTime | EXIF | 75 | 1 | 74 | 0 | 1 | 0 | 0 |
| imazen-codec-corpus | EXIF:DateTimeDigitized | EXIF | 64 | 1 | 63 | 0 | 1 | 0 | 0 |
| imazen-codec-corpus | EXIF:DateTimeOriginal | EXIF | 67 | 1 | 66 | 0 | 2 | 0 | 0 |
| imazen-codec-corpus | EXIF:DevelopmentType | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:DevelopmentTypeDescription | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:DeviceSettingDescription | EXIF | 1 | 0 | 0 | 0 | 0 | 0 | 1 |
| imazen-codec-corpus | EXIF:DigitalZoomRatio | EXIF | 35 | 0 | 35 | 0 | 1 | 0 | 0 |
| imazen-codec-corpus | EXIF:DistortionCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:ExifIFDPointer | EXIF | 94 | 0 | 0 | 0 | 0 | 94 | 0 |
| imazen-codec-corpus | EXIF:ExifVersion | EXIF | 72 | 0 | 72 | 0 | 2 | 0 | 0 |
| imazen-codec-corpus | EXIF:ExposureBiasValue | EXIF | 48 | 0 | 48 | 0 | 1 | 0 | 0 |
| imazen-codec-corpus | EXIF:ExposureIndex | EXIF | 3 | 0 | 2 | 0 | 0 | 1 | 0 |
| imazen-codec-corpus | EXIF:ExposureMode | EXIF | 52 | 52 | 0 | 0 | 2 | 0 | 0 |
| imazen-codec-corpus | EXIF:ExposureProgram | EXIF | 49 | 49 | 0 | 0 | 1 | 0 | 0 |
| imazen-codec-corpus | EXIF:ExposureTime | EXIF | 54 | 0 | 54 | 0 | 1 | 0 | 0 |
| imazen-codec-corpus | EXIF:FileSource | EXIF | 24 | 24 | 0 | 0 | 1 | 0 | 0 |
| imazen-codec-corpus | EXIF:Flash | EXIF | 55 | 55 | 0 | 0 | 1 | 0 | 0 |
| imazen-codec-corpus | EXIF:FlashEnergy | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:FlashpixVersion | EXIF | 47 | 0 | 46 | 0 | 2 | 1 | 0 |
| imazen-codec-corpus | EXIF:FNumber | EXIF | 55 | 0 | 55 | 0 | 1 | 0 | 0 |
| imazen-codec-corpus | EXIF:FocalLength | EXIF | 54 | 0 | 54 | 0 | 1 | 0 | 0 |
| imazen-codec-corpus | EXIF:FocalLengthIn35mmFilm | EXIF | 36 | 36 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:FocalPlaneResolutionUnit | EXIF | 6 | 6 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:FocalPlaneXResolution | EXIF | 6 | 0 | 6 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:FocalPlaneYResolution | EXIF | 6 | 0 | 6 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:GainControl | EXIF | 18 | 17 | 1 | 0 | 1 | 0 | 0 |
| imazen-codec-corpus | EXIF:Gamma | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:GPSAltitude | EXIF | 18 | 0 | 18 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:GPSAltitudeRef | EXIF | 18 | 18 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:GPSAreaInformation | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:GPSDateStamp | EXIF | 20 | 0 | 20 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:GPSDestBearing | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:GPSDestBearingRef | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:GPSDestDistance | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:GPSDestDistanceRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:GPSDestLatitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:GPSDestLatitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:GPSDestLongitude | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:GPSDestLongitudeRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:GPSDifferential | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:GPSDOP | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:GPSHPositioningError | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:GPSImgDirection | EXIF | 17 | 0 | 17 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:GPSImgDirectionRef | EXIF | 17 | 17 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:GPSInfoIFDPointer | EXIF | 22 | 0 | 0 | 0 | 0 | 22 | 0 |
| imazen-codec-corpus | EXIF:GPSLatitude | EXIF | 19 | 18 | 1 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:GPSLatitudeRef | EXIF | 19 | 19 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:GPSLongitude | EXIF | 19 | 18 | 1 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:GPSLongitudeRef | EXIF | 19 | 19 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:GPSMapDatum | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:GPSMeasureMode | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:GPSProcessingMethod | EXIF | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:GPSSatellites | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:GPSSpeed | EXIF | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:GPSSpeedRef | EXIF | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:GPSStatus | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:GPSTimeStamp | EXIF | 20 | 0 | 20 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:GPSTrack | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:GPSTrackRef | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:GPSVersionID | EXIF | 4 | 4 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:Humidity | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:ImageDescription | EXIF | 38 | 38 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:ImageEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:ImageEditor | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:ImageLength | EXIF | 164 | 164 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:ImageTitle | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:ImageUniqueID | EXIF | 8 | 7 | 1 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:ImageWidth | EXIF | 164 | 164 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:InteroperabilityIFDPointer | EXIF | 28 | 0 | 0 | 0 | 0 | 28 | 0 |
| imazen-codec-corpus | EXIF:InteroperabilityIndex | EXIF | 28 | 0 | 0 | 0 | 0 | 28 | 0 |
| imazen-codec-corpus | EXIF:InteroperabilityVersion | EXIF | 28 | 0 | 0 | 0 | 0 | 28 | 0 |
| imazen-codec-corpus | EXIF:ISOSpeed | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:ISOSpeedLatitudeyyy | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:ISOSpeedLatitudezzz | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:ISOSpeedRatings | EXIF | 55 | 53 | 2 | 0 | 1 | 0 | 0 |
| imazen-codec-corpus | EXIF:JPEGInterchangeFormat | EXIF | 50 | 48 | 0 | 0 | 1 | 2 | 0 |
| imazen-codec-corpus | EXIF:JPEGInterchangeFormatLength | EXIF | 50 | 48 | 0 | 0 | 1 | 2 | 0 |
| imazen-codec-corpus | EXIF:LearningOptOutIn | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:LensMake | EXIF | 15 | 15 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:LensModel | EXIF | 16 | 16 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:LensSerialNumber | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:LensSpecification | EXIF | 3 | 0 | 0 | 0 | 0 | 3 | 0 |
| imazen-codec-corpus | EXIF:LightSource | EXIF | 29 | 29 | 0 | 0 | 1 | 0 | 0 |
| imazen-codec-corpus | EXIF:Make | EXIF | 60 | 55 | 5 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:MakerNote | EXIF | 30 | 0 | 0 | 0 | 0 | 30 | 0 |
| imazen-codec-corpus | EXIF:MaxApertureValue | EXIF | 46 | 0 | 45 | 0 | 1 | 0 | 1 |
| imazen-codec-corpus | EXIF:MetadataEditingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:MeteringMode | EXIF | 50 | 50 | 0 | 0 | 1 | 0 | 0 |
| imazen-codec-corpus | EXIF:Model | EXIF | 60 | 47 | 13 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:NoiseReduction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:OECF | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| imazen-codec-corpus | EXIF:OffsetTime | EXIF | 24 | 24 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:OffsetTimeDigitized | EXIF | 12 | 12 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:OffsetTimeOriginal | EXIF | 5 | 5 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:Orientation | EXIF | 152 | 152 | 0 | 0 | 1 | 0 | 0 |
| imazen-codec-corpus | EXIF:Photographer | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:PhotometricInterpretation | EXIF | 155 | 155 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:PixelXDimension | EXIF | 60 | 60 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:PixelYDimension | EXIF | 60 | 60 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:PlanarConfiguration | EXIF | 135 | 135 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:Pressure | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:PrimaryChromaticities | EXIF | 15 | 0 | 15 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:RAWDevelopingSoftware | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:RecommendedExposureIndex | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:ReferenceBlackWhite | EXIF | 8 | 0 | 8 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:RelatedImageFileFormat | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:RelatedImageLength | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:RelatedImageWidth | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:RelatedSoundFile | EXIF | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:ResolutionUnit | EXIF | 170 | 170 | 0 | 0 | 2 | 0 | 0 |
| imazen-codec-corpus | EXIF:RowsPerStrip | EXIF | 139 | 139 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:SamplesPerPixel | EXIF | 154 | 154 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:Saturation | EXIF | 33 | 33 | 0 | 0 | 2 | 0 | 0 |
| imazen-codec-corpus | EXIF:SceneCaptureType | EXIF | 51 | 51 | 0 | 0 | 2 | 0 | 0 |
| imazen-codec-corpus | EXIF:SceneType | EXIF | 40 | 40 | 0 | 0 | 1 | 0 | 0 |
| imazen-codec-corpus | EXIF:SensingMethod | EXIF | 27 | 27 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:SensitivityType | EXIF | 11 | 11 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:ShadingCorrection | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:Sharpness | EXIF | 35 | 35 | 0 | 0 | 2 | 0 | 0 |
| imazen-codec-corpus | EXIF:ShutterSpeedValue | EXIF | 32 | 0 | 31 | 0 | 0 | 0 | 1 |
| imazen-codec-corpus | EXIF:Software | EXIF | 128 | 124 | 4 | 0 | 1 | 0 | 0 |
| imazen-codec-corpus | EXIF:SourceExposureTimesOfCompositeImage | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| imazen-codec-corpus | EXIF:SourceImageNumberOfCompositeImage | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| imazen-codec-corpus | EXIF:SpatialFrequencyResponse | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:SpectralSensitivity | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:StandardOutputSensitivity | EXIF | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:StripByteCounts | EXIF | 142 | 78 | 39 | 0 | 0 | 2 | 23 |
| imazen-codec-corpus | EXIF:StripOffsets | EXIF | 142 | 78 | 39 | 0 | 0 | 2 | 23 |
| imazen-codec-corpus | EXIF:SubjectArea | EXIF | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:SubjectDistance | EXIF | 16 | 0 | 16 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:SubjectDistanceRange | EXIF | 28 | 28 | 0 | 0 | 1 | 0 | 0 |
| imazen-codec-corpus | EXIF:SubjectLocation | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:SubSecTime | EXIF | 12 | 7 | 5 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:SubSecTimeDigitized | EXIF | 13 | 7 | 6 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:SubSecTimeOriginal | EXIF | 23 | 7 | 16 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:Temperature | EXIF | 1 | 0 | 0 | 0 | 0 | 1 | 0 |
| imazen-codec-corpus | EXIF:TransferFunction | EXIF | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:UserComment | EXIF | 20 | 0 | 14 | 0 | 2 | 6 | 0 |
| imazen-codec-corpus | EXIF:WaterDepth | EXIF | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:WhiteBalance | EXIF | 52 | 52 | 0 | 0 | 2 | 0 | 0 |
| imazen-codec-corpus | EXIF:WhitePoint | EXIF | 15 | 0 | 15 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:XResolution | EXIF | 173 | 0 | 173 | 0 | 2 | 0 | 0 |
| imazen-codec-corpus | EXIF:YCbCrCoefficients | EXIF | 5 | 0 | 5 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:YCbCrPositioning | EXIF | 51 | 51 | 0 | 0 | 1 | 0 | 0 |
| imazen-codec-corpus | EXIF:YCbCrSubSampling | EXIF | 12 | 0 | 12 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | EXIF:YResolution | EXIF | 173 | 0 | 173 | 0 | 2 | 0 | 0 |
| imazen-codec-corpus | IPTC:Byline | IPTC | 2 | 0 | 0 | 0 | 0 | 2 | 0 |
| imazen-codec-corpus | IPTC:Caption | IPTC | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | IPTC:City | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | IPTC:CopyrightNotice | IPTC | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | IPTC:CountryCode | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | IPTC:DateCreated | IPTC | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | IPTC:Headline | IPTC | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | IPTC:Keywords | IPTC | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | IPTC:ObjectName | IPTC | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | XMP:XMP-dc:Creator | XMP | 2 | 2 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | XMP:XMP-dc:Description | XMP | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | XMP:XMP-dc:Title | XMP | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| imazen-codec-corpus | XMP:XMP-xmp:CreateDate | XMP | 32 | 0 | 32 | 0 | 5 | 0 | 0 |

## Fixture hashes

| fixture | bytes | SHA-256 | format | producer |
| --- | ---: | --- | --- | --- |
| ianare-exif-py/tests/resources/heic/heic_hdlr_box.jpg | 101897 | `f576d9c6b7c3d9531a4bc10e9fa34ecdcebdf6773a907c4892fa680b8557a279` | heif | unknown |
| ianare-exif-py/tests/resources/heic/mobile/HMD_Nokia_8.3_5G.heif | 3019841 | `c2820b3e4e0368c6f031b28b62945658a97446895cb446dfc37acdcf7109e0f5` | heif | unknown |
| ianare-exif-py/tests/resources/heic/mobile/HMD_Nokia_8.3_5G_hdr.heif | 865787 | `17fccf795b0e2b749b9f5667ffcea31e665cb6964fb104b001684c60a14acb4d` | heif | unknown |
| ianare-exif-py/tests/resources/heic/mobile/iphone_13_pro_max.heic | 2182707 | `e760c80eed310e4f27c092d5487693ca8e104e7cc01d25ba4828deb28f679676` | heif | Apple |
| ianare-exif-py/tests/resources/heic/samplefilehub.heif | 29208 | `f86ec0d3a6c82e31657bb1886e1ec95579329fa98d8be511ac1e8497c778e07f` | heif | unknown |
| ianare-exif-py/tests/resources/heic/spring_1440x960.heic | 51899 | `2b81d5e490f310ef0779ab022ee0f700f6babdb5914b1e659df9912a1a71aa52` | heif | unknown |
| ianare-exif-py/tests/resources/jpg/Canon_40D.jpg | 7958 | `6bfdabd4fc33d112283c147acccc574e770bbe6fbdbc3d4da968ba7b606ecc2f` | jpeg | Canon |
| ianare-exif-py/tests/resources/jpg/Canon_40D_photoshop_import.jpg | 9686 | `40a7aa2cc28d8544b31408e6d54c568e6b749a8faf239c7a6234b315e953b9d5` | jpeg | unknown |
| ianare-exif-py/tests/resources/jpg/Canon_DIGITAL_IXUS_400.jpg | 9198 | `23c1ec51c075d6864862412d07b9d0f07e84237af68972c1d1293e4c28f73e4f` | jpeg | Canon |
| ianare-exif-py/tests/resources/jpg/Canon_PowerShot_S40.jpg | 32764 | `8a9d04b92d0de5836c59ede8ae421235488e4031e893e07b1fe7e4b78f6a9901` | jpeg | Canon |
| ianare-exif-py/tests/resources/jpg/Fujifilm_FinePix6900ZOOM.jpg | 4278 | `40afc753b4e83d72cfa1080ae7a10310e0fcbb9e4f6ebdf32c7b2f1553c83fe3` | jpeg | FUJIFILM |
| ianare-exif-py/tests/resources/jpg/Fujifilm_FinePix_E500.jpg | 2241 | `ffbee7b07bf267dc0fb52817f8866df647758f7d48ac93e7a73d1914fb4c74da` | jpeg | FUJIFILM |
| ianare-exif-py/tests/resources/jpg/Kodak_CX7530.jpg | 5958 | `ac759931999a215ef78469a82bdfc382ccba96eb8d039ec9e81e53a9a419d35e` | jpeg | EASTMAN KODAK COMPANY |
| ianare-exif-py/tests/resources/jpg/Konica_Minolta_DiMAGE_Z3.jpg | 36971 | `b1b914f47528384e6252fa7caabb489f123b88c81ebd62ecb8eacdf64c46fd5e` | jpeg | KONICA MINOLTA |
| ianare-exif-py/tests/resources/jpg/Nikon_COOLPIX_P1.jpg | 7068 | `896b47424dc1c87154a50b40394ae887a0b0d7d830f38a9d969295995f27ef43` | jpeg | NIKON |
| ianare-exif-py/tests/resources/jpg/Nikon_D70.jpg | 14034 | `8e2a627b96ca71c20129161f46bda3d338407da99bd11b1055adb27af27d7ef5` | jpeg | NIKON CORPORATION |
| ianare-exif-py/tests/resources/jpg/Olympus_C8080WZ.jpg | 3224 | `3495de26279d8d1e442177ba43cef855438e3b321481b9ee2ff513decb13ed9c` | jpeg | OLYMPUS CORPORATION |
| ianare-exif-py/tests/resources/jpg/PaintTool_sample.jpg | 5738 | `45e3aa44357a4b05d78b3fc51d0732be0ddf5a544b732b0134778b146380291a` | jpeg | unknown |
| ianare-exif-py/tests/resources/jpg/Panasonic_DMC-FZ30.jpg | 10769 | `c092a4ade7ae7b63ac13d50c3dc9da51ce2fb465caf7d1b6193d4c53f59e8ad8` | jpeg | Panasonic |
| ianare-exif-py/tests/resources/jpg/Pentax_K10D.jpg | 12077 | `146601c9d406410abdaa832508ee4ccddbc7ad54530e81d57962c1b7728e2e6d` | jpeg | PENTAX Corporation |
| ianare-exif-py/tests/resources/jpg/Reconyx_HC500_Hyperfire.jpg | 425890 | `d7ba6bc532a225c955411cb96c733a45ee39403fa973312bded7732e6f8e4b3c` | jpeg | unknown |
| ianare-exif-py/tests/resources/jpg/Ricoh_Caplio_RR330.jpg | 3662 | `e920d750c491f3088eeb0f31fb4659164755af11e4bbbe269430f32c3ae10928` | jpeg | Caplio |
| ianare-exif-py/tests/resources/jpg/Samsung_Digimax_i50_MP3.jpg | 45286 | `e61da5ee8d7ba1726bd0a887216ed5ae7ca38c97fcf7aac11b808e1c269e1722` | jpeg | Samsung Techwin |
| ianare-exif-py/tests/resources/jpg/Sony_DSLR-A200.jpg | 632566 | `a21730078d69b6300c87db44a6912979b1812dd8e6f7b131e6c4709d940423ed` | jpeg | SONY |
| ianare-exif-py/tests/resources/jpg/Sony_HDR-HC3.jpg | 3565 | `4f707d9b40d423a5246748bc1e05b66c4b87e30863f7a51ce18904a7ec43a39e` | jpeg | SONY |
| ianare-exif-py/tests/resources/jpg/Sony_alpha_a58.JPG | 24871 | `227f97c068d3fe038901b238580bac6440a6f172667b317fa85712388d73d9f7` | jpeg | SONY |
| ianare-exif-py/tests/resources/jpg/WWL_Polaroid_ION230.jpg | 3998 | `27532bdce8a2ad2afc1e392f4d24105867eec0b1ba126b01b3e398100daab664` | jpeg | WWL |
| ianare-exif-py/tests/resources/jpg/corrupted.jpg | 1960703 | `dcc801f45d7607d82661d08c4c6b188bdbf3129b55f7612830a6dc3fea573023` | jpeg | OLYMPUS IMAGING CORP. |
| ianare-exif-py/tests/resources/jpg/exif-org/canon-ixus.jpg | 128037 | `b2d085bdb261cb2c56d8ba10d79175e38c0acd0d429afe19a4610eddee3b06fe` | jpeg | Canon |
| ianare-exif-py/tests/resources/jpg/exif-org/fujifilm-dx10.jpg | 133074 | `7d6f8f7450f12bd768384a9cae66a9cc0f626cea023431614d967f34150def0d` | jpeg | FUJIFILM |
| ianare-exif-py/tests/resources/jpg/exif-org/fujifilm-finepix40i.jpg | 43183 | `722fa6b893b01d5970d9b0761df6ee97bcee28fcd5b8e78d761738058c6b7822` | jpeg | FUJIFILM |
| ianare-exif-py/tests/resources/jpg/exif-org/fujifilm-mx1700.jpg | 100227 | `f45a5d2c1c5f3ae55254239c02b569c01dd3926a64e08d4a141ce4dbff637856` | jpeg | FUJIFILM |
| ianare-exif-py/tests/resources/jpg/exif-org/kodak-dc210.jpg | 79837 | `6da5cfdcbd2d462220da5ac1c4e0df32c61f078efe92c777036cf629fe791ad5` | jpeg | Eastman Kodak Company |
| ianare-exif-py/tests/resources/jpg/exif-org/kodak-dc240.jpg | 81901 | `6dcac4b77b55a9f5e5c0486c1f28b8b2eb65b292d3c43499cdde47ef11d367a4` | jpeg | EASTMAN KODAK COMPANY |
| ianare-exif-py/tests/resources/jpg/exif-org/nikon-e950.jpg | 164151 | `7920518dec63a63074ca8e1861b61f69be687b3dd0caa3eb65cdaac4c4f43fd0` | jpeg | NIKON |
| ianare-exif-py/tests/resources/jpg/exif-org/olympus-c960.jpg | 87599 | `325671969a8059d2ad0036e2db8476262592add0ca5174c260fa03e9e455809d` | jpeg | OLYMPUS OPTICAL CO.,LTD |
| ianare-exif-py/tests/resources/jpg/exif-org/olympus-d320l.jpg | 61264 | `6a41599dc31c73e8a9c896e2669ecfb2b03a74be04fac0dd9371ed457e50a762` | jpeg | unknown |
| ianare-exif-py/tests/resources/jpg/exif-org/ricoh-rdc5300.jpg | 87626 | `16182006e2f82e60f11e0bad3964cac539bba4e58d14a3152bfe5aeb1907ab19` | jpeg | RICOH |
| ianare-exif-py/tests/resources/jpg/exif-org/sanyo-vpcg250.jpg | 62096 | `4723c892d4d3c200074f3a8a437b0d3e62e631e140b68e2386a54c45f0da2566` | jpeg | SANYO Electric Co.,Ltd. |
| ianare-exif-py/tests/resources/jpg/exif-org/sanyo-vpcsx550.jpg | 102448 | `74401cc6e0b6bdb03b7d3a1c99a0ba3b4dd5b3ac9b7728a38f6fb3607f3360ea` | jpeg | SANYO Electric Co.,Ltd. |
| ianare-exif-py/tests/resources/jpg/exif-org/sony-cybershot.jpg | 63643 | `0e69b12f261907dc9fcfb89082a6a61948db849d836673017a7e972d49184404` | jpeg | SONY |
| ianare-exif-py/tests/resources/jpg/exif-org/sony-d700.jpg | 79446 | `8ff0028190b36a6c4af79989b248dd5e949d289d32c5f0e005be2db45d363c98` | jpeg | SONY |
| ianare-exif-py/tests/resources/jpg/exif-org/sony-powershota5.jpg | 58405 | `608c6c0a57205c42ca4169b5574823ed1c05e4e636a038cda64b6ef18ae5d274` | jpeg | unknown |
| ianare-exif-py/tests/resources/jpg/gps/DSCN0010.jpg | 161713 | `17307b1207eb6487d7908e9d154890b46e3d2e0192369cfd3f4c33d5a5af4035` | jpeg | NIKON |
| ianare-exif-py/tests/resources/jpg/gps/DSCN0012.jpg | 159137 | `84d60184ac4098b7967e2ef6dae6b03fc0d98b24624d2b57412dbcd7cb864680` | jpeg | NIKON |
| ianare-exif-py/tests/resources/jpg/gps/DSCN0021.jpg | 157382 | `441daaea545eb8bdb1434817fc36be0baa8992a4c9ad4b089726033bfc4bc963` | jpeg | NIKON |
| ianare-exif-py/tests/resources/jpg/gps/DSCN0025.jpg | 150301 | `9437619d5ab1afe7740d546effe76ffe52548af68b9be72cef259d0cd1f9c90b` | jpeg | NIKON |
| ianare-exif-py/tests/resources/jpg/gps/DSCN0027.jpg | 157723 | `0a7864e5fa07cc118f3df1e38f31e5181350c30010e8115c536c7a8a664c9f13` | jpeg | NIKON |
| ianare-exif-py/tests/resources/jpg/gps/DSCN0029.jpg | 150085 | `941b9c7bfe35e0a3775f013e613748f55d1152736a74bd51e34f1b66bd646697` | jpeg | NIKON |
| ianare-exif-py/tests/resources/jpg/gps/DSCN0038.jpg | 157569 | `84792ae83e6ec83a5d909be82f68e51aeea67fdd6a7019993fdac4be4f6e6a72` | jpeg | NIKON |
| ianare-exif-py/tests/resources/jpg/gps/DSCN0040.jpg | 152893 | `14f6453d145c69c96e77c7e901cdbf58f7984c09fe4ab65ca8914c5d0d37e956` | jpeg | NIKON |
| ianare-exif-py/tests/resources/jpg/gps/DSCN0042.jpg | 156695 | `03837b2881d4cc7e5e03191b301f082088f999e4aa59e4489193874c93c31579` | jpeg | NIKON |
| ianare-exif-py/tests/resources/jpg/hdr/canon_hdr_NO.jpg | 784371 | `fa2127ebab1b3930c998ab262795044262f41dda7eaf0f7a21a773cff48c8696` | jpeg | Canon |
| ianare-exif-py/tests/resources/jpg/hdr/canon_hdr_YES.jpg | 722875 | `30603e14619140acaea51bee6fecab4a72956d1aa570e20f5b9b3d9271b8bdf4` | jpeg | Canon |
| ianare-exif-py/tests/resources/jpg/hdr/iphone_hdr_NO.jpg | 1957448 | `eb81d33a9b1d1bea5d133483f918c2cc927161c0dda44c9fedfa4da87c8b1cc3` | jpeg | Apple |
| ianare-exif-py/tests/resources/jpg/hdr/iphone_hdr_YES.jpg | 1976579 | `5125870f6f4a94a2329bc9f53482680772d3277399aed71c2f0636cb07870533` | jpeg | Apple |
| ianare-exif-py/tests/resources/jpg/invalid/image00971.jpg | 164210 | `4793aef30d2d042f15723bf22fa8c5b9932c6b5e97bc090e7a82c0845b2a47db` | jpeg | unknown |
| ianare-exif-py/tests/resources/jpg/invalid/image01088.jpg | 87107 | `99366772dd3e323d52bf6667b2955c8a2859f0ba9d88d96c2c0a0ade16d96d9e` | jpeg | unknown |
| ianare-exif-py/tests/resources/jpg/invalid/image01137.jpg | 26898 | `d28160c63cbb4c9a9709e917b1bf0208d6240d1d3e22b28ec23abb08f957c52c` | jpeg | unknown |
| ianare-exif-py/tests/resources/jpg/invalid/image01551.jpg | 15994 | `ef8e654304d58238af70f4ba8f52b095c8d801ebba0dfb6b089b53d835c36c5a` | jpeg | unknown |
| ianare-exif-py/tests/resources/jpg/invalid/image01713.jpg | 17412 | `5281b682dc913fee5a3b7d172bfb8c8068a1bcc3138c3d29f98db34bc807798c` | jpeg | unknown |
| ianare-exif-py/tests/resources/jpg/invalid/image01980.jpg | 17857 | `0eda850fefce6ae4c148815bfb20962309b75e542de421845615ccef7a962f00` | jpeg | unknown |
| ianare-exif-py/tests/resources/jpg/invalid/image02206.jpg | 14574 | `527ae341310acbdeedf60d1087a23081ed279e3e6ecdd7e4b82d586acfbc0735` | jpeg | unknown |
| ianare-exif-py/tests/resources/jpg/long_description.jpg | 7585 | `1a6e4a1b7fab604027cbb52b6cde75f6966c8b9a2eb3ea0fba5e1bf59605a339` | jpeg | unknown |
| ianare-exif-py/tests/resources/jpg/mobile/HMD_Nokia_8.3_5G.jpg | 2190194 | `9be023624ccd5846beeb5b02d9b571251ef5bd8ed820389a430d114029f58eda` | jpeg | HMD Global |
| ianare-exif-py/tests/resources/jpg/mobile/HMD_Nokia_8.3_5G_hdr.jpg | 5168013 | `b150f64e631b0df0f70cdbb88ddcbb73c5536fcb840ace8d0e71f8d58d997bc1` | jpeg | HMD Global |
| ianare-exif-py/tests/resources/jpg/mobile/jolla.jpg | 811904 | `ee6bc1200cf8b1b26f5b60d8294d9617e8099f6dfdd7a4757a424f332360f5e3` | jpeg | Jolla |
| ianare-exif-py/tests/resources/jpg/orientation/landscape_1.jpg | 139435 | `87ea27ba9f24cb133251850a7ebd11427ba5e4be0a3a8534a58b00041b2db06d` | jpeg | unknown |
| ianare-exif-py/tests/resources/jpg/orientation/landscape_2.jpg | 137359 | `47aa72c02bd24b17db58cd8e25a57dd97f54abc9461fc1fb8bf2d8889d8494a5` | jpeg | unknown |
| ianare-exif-py/tests/resources/jpg/orientation/landscape_3.jpg | 140965 | `533f2e6d35a62e9bc144dbb3921a9b2105cf2498eaafb10812f197e6108bd758` | jpeg | unknown |
| ianare-exif-py/tests/resources/jpg/orientation/landscape_4.jpg | 140588 | `552568f6965f76c94fced5cd3286775fcc7746fbc796f7a7ab8e7c8d533b666c` | jpeg | unknown |
| ianare-exif-py/tests/resources/jpg/orientation/landscape_5.jpg | 137611 | `592f903706fe4b215a08adbd0ed8b62d28aad4e6532ee13777f4aa12787f54a7` | jpeg | unknown |
| ianare-exif-py/tests/resources/jpg/orientation/landscape_6.jpg | 137628 | `a05082c57819232106a0612f57268efab011f7a2a477483b878a2b4509cd8e59` | jpeg | unknown |
| ianare-exif-py/tests/resources/jpg/orientation/landscape_7.jpg | 140645 | `e5273d4ea5fddcaf27fefc7ea4162c2b3c77ad056e2d8d65a5d61787b5b15db4` | jpeg | unknown |
| ianare-exif-py/tests/resources/jpg/orientation/landscape_8.jpg | 141286 | `5b5c9979cbf6077e97894488be20c849b5eb008fe685c0cb75060c4ab6812ce0` | jpeg | unknown |
| ianare-exif-py/tests/resources/jpg/orientation/portrait_1.jpg | 129059 | `31b06a687d094aabaab611bbdb83b37bee044d7411087e24120169a8a7d5a511` | jpeg | unknown |
| ianare-exif-py/tests/resources/jpg/orientation/portrait_2.jpg | 136072 | `f0b06c75694f6d97e17121dae0697832dea0daf0cd81e4d0e8107cbe8a7e299f` | jpeg | unknown |
| ianare-exif-py/tests/resources/jpg/orientation/portrait_3.jpg | 135813 | `ca9fb9a159320e6209d53a579b04be323095797b8bfc8ab5110ec8c38ecf9818` | jpeg | unknown |
| ianare-exif-py/tests/resources/jpg/orientation/portrait_4.jpg | 131520 | `50fc16ad1174fc6eddd002ecd8baa310132c56fd8f732096889e105d718fac1a` | jpeg | unknown |
| ianare-exif-py/tests/resources/jpg/orientation/portrait_5.jpg | 133715 | `dfbdfaf8a72e4fde8686c08df6cfe332864635affd0a9fb6e06cb106094b302e` | jpeg | unknown |
| ianare-exif-py/tests/resources/jpg/orientation/portrait_6.jpg | 136257 | `323ce0d7140be76cbe6511e268766241dfe74eddf34b73f27f4637e552c8d824` | jpeg | unknown |
| ianare-exif-py/tests/resources/jpg/orientation/portrait_7.jpg | 135366 | `792794408dc57227adb341a75a5766e36904a7ec0e640d6cca2d8b14fe25c141` | jpeg | unknown |
| ianare-exif-py/tests/resources/jpg/orientation/portrait_8.jpg | 132543 | `2691666c64b68d563f50226c2df921c9edee827abf402e922be4be2e992fb061` | jpeg | unknown |
| ianare-exif-py/tests/resources/jpg/tests/11-tests.jpg | 236569 | `2a41ccc348800707d7c19ce0e3457f5d4295486f29bf0a73f8cbe4bcf272136e` | jpeg | Canon |
| ianare-exif-py/tests/resources/jpg/tests/22-canon_tags.jpg | 448492 | `494458d1d90e7d2b7c1aefe362cbf167ecdca1f3477f0bd2c801503a1d537b14` | jpeg | Canon |
| ianare-exif-py/tests/resources/jpg/tests/28-hex_value.jpg | 1350507 | `2a08dd2931cb224f9b4864a4699cdd5093ed334faf68c9d2ef1e832855b219ae` | jpeg | Canon |
| ianare-exif-py/tests/resources/jpg/tests/30-type_error.jpg | 300825 | `f2c156654b78e8a1f84a4d60932a15e76d3e106c7e51bd968fe2f5eda4d33f4d` | jpeg | unknown |
| ianare-exif-py/tests/resources/jpg/tests/32-lens_data.jpeg | 36731 | `f0096a6d5c24dbe270525f7dc575e26ea28df63824055e7ad3253e2cf0d1dab0` | jpeg | NIKON CORPORATION |
| ianare-exif-py/tests/resources/jpg/tests/33-type_error.jpg | 178028 | `16713b68edda8862069993045bfdba03f1c63c5f05857955f5a98c2c82ca5598` | jpeg | Canon |
| ianare-exif-py/tests/resources/jpg/tests/35-empty.jpg | 1010466 | `44f1819124a7f7dba6552f629372649441f8ab24e4e7f4c1ebe5091d582220c8` | jpeg | CASIO COMPUTER CO.,LTD |
| ianare-exif-py/tests/resources/jpg/tests/36-memory_error.jpg | 865978 | `3b0d73976a304eb0fe99048b066e19e6006b35cb620737af4c8915acedf98b16` | jpeg | CASIO COMPUTER CO.,LTD. |
| ianare-exif-py/tests/resources/jpg/tests/42_IndexError.jpg | 2913134 | `d64e7c04839af125647d5a7500eb3b3e1b5c1ef81698a60e8b48b272f9ca5090` | jpeg | OLYMPUS IMAGING CORP. |
| ianare-exif-py/tests/resources/jpg/tests/45-gps_ifd.jpg | 230349 | `0a986ea141d5f8f8b7588d6217e9a2d12140a76ec36cb0a022710c3e9fdfc921` | jpeg | Polyphony Digital Inc. |
| ianare-exif-py/tests/resources/jpg/tests/46_UnicodeEncodeError.jpg | 10514729 | `3cf5ec5d6337fb31c90aa081654137c8e936b828809a2f3a91d2406188220090` | jpeg | Canon |
| ianare-exif-py/tests/resources/jpg/tests/67-0_length_string.jpg | 162716 | `d45980d197658e88f7a4452b379fc3e9b2feb37f1b271ad7e5ce8560da8c2b10` | jpeg | samsung |
| ianare-exif-py/tests/resources/jpg/tests/87_OSError.jpg | 889829 | `1f2b247e1ab6c26a41f670a7653404eda7eb198e923d71cafea04a0a934380e6` | jpeg | NIKON CORPORATION |
| ianare-exif-py/tests/resources/jpg/tests/Xiaomi_Mi_9T_KeyError.jpg | 4137722 | `cf0be8f4b96d3792e27ff54b4efddb20a5b063ed54925c501d32977fb5c2aba7` | jpeg | Xiaomi |
| ianare-exif-py/tests/resources/jpg/tests/nikon_D3100_TypeError.jpg | 22150 | `cd2de0459c0bdf5fada567b7beb5937a0bbfd3964d1122889bd8211f443a4267` | jpeg | NIKON CORPORATION |
| ianare-exif-py/tests/resources/jpg/xmp/BlueSquare.jpg | 24205 | `1e1cdf92904b5da35302c2655e5f7a2ea68d6bf8d9b3922225e3f2a17ba3bb6b` | jpeg | unknown |
| ianare-exif-py/tests/resources/jpg/xmp/no_exif.jpg | 182252 | `8e8c4a3233e1293fbe46933bdf38c85fdbcd070b8f5daa4f8b4342371d1d9673` | jpeg | unknown |
| ianare-exif-py/tests/resources/tiff/Arbitro.tiff | 6925 | `26f4b11c45ad3e56a530d03967ff4627892b3264183b85fefba194ff1fe3e08e` | tiff | unknown |
| ianare-exif-py/tests/resources/tiff/BSG1.tiff | 288538 | `f6e07811917470456d85bbe0d2c00f11fe57ea212afc33432e4457dfca6bd2a5` | tiff | unknown |
| ianare-exif-py/tests/resources/tiff/Crémieux11.tiff | 10944 | `bda84c06634c1dd5f79c324829c485ee39dd24bf6d91e7fd81986cd0520eea18` | tiff | unknown |
| ianare-exif-py/tests/resources/tiff/DudleyLeavittUtah.tiff | 91504 | `eabf6e832781b0c0130b8e0cb2533877ed11118bb08b7cdfe8939afe9997acc6` | tiff | unknown |
| ianare-exif-py/tests/resources/tiff/Jobagent.tiff | 13068 | `8038925348ca9606995c95438d50630982069063b7c428b126a3282a01f246cd` | tiff | unknown |
| ianare-exif-py/tests/resources/tiff/Picoawards.tiff | 15512 | `50dda7bf3c42e6c3979e25d6fec05d01e424274c8f28c4c9a911966d4faeb33e` | tiff | unknown |
| ianare-exif-py/tests/resources/tiff/Rudless.tiff | 74954 | `be28b5a40ad84fbeb9a2fa8fb34fe16cd22560ff7d0cf70cfad3da8183d02b21` | tiff | unknown |
| ianare-exif-py/tests/resources/tiff/Tless0.tiff | 21994 | `32f6aab90dc2d284a83040debe379e01333107b83a98c1aa2e6dabf56790b48a` | tiff | unknown |
| imazen-codec-corpus/jpeg-conformance/crash-repro/jpeg-decoder-257/03032011362.jpg | 703828 | `1397eae02b1957a21a68aeca4b8a0743a9d48733fc739cc75937dcf438c85d01` | jpeg | Nokia |
| imazen-codec-corpus/jpeg-conformance/crash-repro/jpeg-decoder-257/1133349251_i_5957_full.jpg | 71227 | `0a36c17fb4a03ea398f0c039485399c38d26d478878fc0ab9e0956489e6918c4` | jpeg | SONY |
| imazen-codec-corpus/jpeg-conformance/crash-repro/jpeg-decoder-257/1212.jpg | 36691 | `5e70a407394ef8485a5cc61f49d187f722e025906586ab9678148bde0a19ea78` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/crash-repro/jpeg-decoder-257/1335488m.jpg | 37730 | `518f35acb7b493cf1f441c5d639e4bbb679dce93644abcf126fcc1dacf31dd40` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/crash-repro/jpeg-decoder-257/154.jpg | 4429189 | `515238d2df6dd78045dc613eeb1d442a4f6b837f3130e9a4573a01c8a305b56d` | jpeg | samsung |
| imazen-codec-corpus/jpeg-conformance/crash-repro/jpeg-decoder-257/21082008025.jpg | 683870 | `af874bdc7b2628f626cbe7a4778cea885baa0c297ab12690e6169509423adfe9` | jpeg | Nokia |
| imazen-codec-corpus/jpeg-conformance/crash-repro/jpeg-decoder-257/21082008029.jpg | 592589 | `c8f2df78b9a5d0ad17e415618761dc0a2754ce9008dc68978c1e44a1dee49c75` | jpeg | Nokia |
| imazen-codec-corpus/jpeg-conformance/crash-repro/jpeg-decoder-257/DSC07578.JPG | 2562139 | `3f3c3814566e1f066fb1a1263bb249385fdbbb4e2866b85434d3f7b9502f72ca` | jpeg | SONY |
| imazen-codec-corpus/jpeg-conformance/crash-repro/jpeg-decoder-257/DSC07826.JPG | 2775765 | `99a1ba350cb79f133cd10b9a111c558edc6988f80ce00900558c7efcc141dd37` | jpeg | SONY |
| imazen-codec-corpus/jpeg-conformance/crash-repro/jpeg-decoder-257/DSC09303.JPG | 2951498 | `511840ada0f3540cbcea220fe5acb9d8051a408fa0c9daa90e6aaed79c998261` | jpeg | SONY |
| imazen-codec-corpus/jpeg-conformance/crash-repro/jpeg-decoder-257/DSCN3918.jpg | 449991 | `ef5aedc8c945a4302574705f1e333bde98f53a1af0793a2e9d0734921a264f16` | jpeg | NIKON |
| imazen-codec-corpus/jpeg-conformance/crash-repro/jpeg-decoder-257/DSCN3924.jpg | 464825 | `a0a5a40ec61544028f92410a57fe4a639fa77775101f265e83ae773cb8784c10` | jpeg | NIKON |
| imazen-codec-corpus/jpeg-conformance/crash-repro/jpeg-decoder-257/DSCN3930.jpg | 457538 | `ad84b5fbc0eaab399a00ee00937b7e7ecb8a7194f4d952dc2d0e36ac599d6d30` | jpeg | NIKON |
| imazen-codec-corpus/jpeg-conformance/crash-repro/jpeg-decoder-257/DSCN3934.jpg | 462652 | `5448256c5e6f90a34e70ef4320924301b83c34d0b3a4061787a8053bed70cdc0` | jpeg | NIKON |
| imazen-codec-corpus/jpeg-conformance/crash-repro/jpeg-decoder-257/DSCN3936.jpg | 479592 | `2a9b4a0c28cc1e6d852444d1045485daf4cfe8205a9af43778b671fbf24596d1` | jpeg | NIKON |
| imazen-codec-corpus/jpeg-conformance/crash-repro/jpeg-decoder-257/DSCN3937.jpg | 479656 | `4177dac2b540db96b82efc97a3db410d83ec7b0013e1d6f6d16a423fbd610a68` | jpeg | NIKON |
| imazen-codec-corpus/jpeg-conformance/crash-repro/jpeg-decoder-257/DSCN3942.jpg | 488619 | `d92106543dd6744b9f94ef398af1a259a2c696db3dcf5295f0286a7b51c6cb66` | jpeg | NIKON |
| imazen-codec-corpus/jpeg-conformance/crash-repro/jpeg-decoder-257/DSCN3946.jpg | 458030 | `b3855de8f40287c068f2d12b2a250930bff86113e389c96ae572422776644a10` | jpeg | NIKON |
| imazen-codec-corpus/jpeg-conformance/crash-repro/jpeg-decoder-257/Greenwich 80.JPG | 3131763 | `5f187c4f04026afd5203ca3c5fc503c2312c653873b22fe54e0bc33c103edbaf` | jpeg | NIKON CORPORATION |
| imazen-codec-corpus/jpeg-conformance/crash-repro/jpeg-decoder-257/IMG0176.jpg | 535343 | `e7eb22d2e31c6ee15cbc36a34186a6171e0f554d85c262f61897b83be604110a` | jpeg | Nokia |
| imazen-codec-corpus/jpeg-conformance/crash-repro/jpeg-decoder-257/amazed2k1424ktv.jpg | 1509781 | `8525264ec72737f5b91a50e9842c6d47debb59a77c86205c4e1f29156e10c632` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/crash-repro/jpeg-decoder-257/e881bf9e898c2383818f18d9972fb18b_full.jpg | 65536 | `d455f10ed0952bb99a75b39b99eb2fe6ce393eafad4e0bf24f39c795cc891bd2` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/crash-repro/jpeg-decoder-257/fantasy-20180613-the-shrine-zhenshchina-koloss-kamni.jpg | 196298 | `01a748d05b3f7c5f6c9b459ef764799e169ba2401cc61aa64b8b1c1a43f315ec` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/crash-repro/jpeg-decoder-257/l1048750854.jpg | 47305 | `dcf3404ef4cb85829a8dd090f2de48e48a924c60aef5db3a35e9de8b8789e7a6` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/crash-repro/jpeg-decoder-257/myasnik-1120120038_i_6092.jpg | 41528 | `cddc909da7a2c8528d2552a031f64e19696439012fda76c4ff202c7e791080bc` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/crash-repro/jpeg-decoder-257/painting-20180529-peter-miork-mionsted-peder-mork-monsted-danish-realist-pai-4.jpg | 966344 | `d53c09c6e8afbe5f0f25b2acb6bf35667b55ede197b34b0626217d73814f1acc` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/crash-repro/jpeg-decoder-257/textures-20181017-osen-listia-fon-background-autumn-leaves-osennie-maple.jpg | 32455 | `2ba653ff8aec270bdec9dcb219829617042d6e4bf85f9eb9e3847f0911a0c38e` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/crash-repro/jpeg-decoder/jd_001_decode_failure.jpeg | 101449 | `295656674c25b83ad36eee6d062409cdcbc7386df8d186f78f14cbadd338c26a` | unknown | unknown |
| imazen-codec-corpus/jpeg-conformance/crash-repro/jpeg-decoder/jd_043_sony_ericsson.jpg | 334451 | `a847ed5c20ea75f8938cd5218ed1c8f8d63783d612deaab5e92a525fbb597c5d` | jpeg | SONY ERICSSON |
| imazen-codec-corpus/jpeg-conformance/crash-repro/jpeg-decoder/jd_052_rst_marker.jpg | 926632 | `746845634fd4ea1ea33ced0fae2d577d918f70a38a443b8ea8c88943ab1bf118` | jpeg | Samsung |
| imazen-codec-corpus/jpeg-conformance/crash-repro/jpeg-decoder/jd_095_exif_zero.jpg | 2487519 | `ffe59592c0180b532741363edfa5634ad570bb6d69d1be467c154d5dfe4c459b` | jpeg | samsung |
| imazen-codec-corpus/jpeg-conformance/crash-repro/jpeg-decoder/jd_110_invalid_dht.jpg | 115852 | `d190fbf8d743bdfadfb1a806816b6612de026c5aaa6d6e457fdb1cec01353370` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/crash-repro/jpeg-decoder/jd_125_oob_access.jpg | 205866 | `1d49b3a4475717df8d876f7f9ec57e64c046f2cd68f8925d77605d66a07ee77f` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/crash-repro/jpeg-decoder/jd_130_progressive_jpeg.jpg | 1496231 | `623d4fcd0b2e5bac97cb2569a7c61f71e281d9e95a8e17f03b5b479439864b6a` | jpeg | samsung |
| imazen-codec-corpus/jpeg-conformance/crash-repro/jpeg-decoder/jd_148_assertion_failed.jpg | 51920 | `88167c59be9c2dc8e2e748dea3c5da4f7c293f27222533712294f01ae33480b7` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/crash-repro/jpeg-decoder/jd_151_unset_quant_table.jpg | 5554227 | `faa7239b305dab4e6cead19fd5cedb135fb2b36c33d76a2b65da6778d5a6283a` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/crash-repro/jpeg-decoder/jd_169_corrupt_no_error.jpg | 309443 | `cf0b1a160da784d51cc7144e31d8b91902e5da4a9c8e6ba3d67806c9f1e60ed1` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/crash-repro/jpeg-decoder/jd_173_corrupt_output.jpg | 51924 | `b04ee9bf40d366f2cef4d290aceea356b5dee3f9249c344417cb7bf55acc6427` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/crash-repro/jpeg-decoder/jd_194_release_panic.jpg | 69902 | `b0553889740097d234cd8c5c8774699caa1fa0f25c005f92442836b4e0fb1afe` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/crash-repro/jpeg-decoder/jd_249_incorrect_decode.jpg | 35821 | `0c6f9651d06d0196448af46a9bbbcb14b83ff5419225a74ed18b8c38517faf74` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/crash-repro/jpeg-decoder/jd_251_fill_buffer.jpg | 39616 | `a24684611e112bb6ec13f38ece3ad2960bf39387b09467f703e0c9a776bc67a1` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/crash-repro/jpeg-decoder/jd_262_truncated_eof.jpg | 145640 | `bed364353b14e42dbe2d20bdac64d9e357df0f183f5da89e3ff387ba67821680` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/crash-repro/libjpeg-turbo/ljt_259_int_overflow_dc_first.jpg | 205232 | `66df81a96cb1c51130b3145d5821e3cab69a2397321f3c8412b2e93fdbbefd3c` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/crash-repro/libjpeg-turbo/ljt_347_signed_overflow_dc_1.jpg | 2645647 | `c345c41470f33793162a7448746a98f8adb24f40e001725d1ef47592c7db32dd` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/crash-repro/libjpeg-turbo/ljt_347_signed_overflow_dc_2.jpg | 3459607 | `9e9406ea4151dac4b643963c29c3b18d14043a86f4a07e8286c15fd74f78b3a7` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/crash-repro/libjpeg-turbo/ljt_509_missing_huffman_table.jpg | 203302 | `0b3164787d5ba22faeb6c1541589cf00ff0a73a39f964525d1e374cc3bee8c05` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/crash-repro/libjpeg-turbo/ljt_669_uaf_ycc_rgb_a.jpg | 54131 | `67420d8c520fbd52b16b4665b03ebe3b205fdc28dd05e8a421ac0aa1052585d8` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/crash-repro/libjpeg-turbo/ljt_758_segv_adjust_quant_poc.jpg | 42546 | `3aa23d4079dc15519442d729f113209456fdb57f086cba0f2764e31c692a0f50` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/crash-repro/zune-jpeg/zj_004_garbled.jpg | 87243 | `fe44e67b4b46f67a3ce818e4c416268df4d172bd1babb42148bbbe7cbaec992e` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/crash-repro/zune-jpeg/zj_005_black_stripe.jpg | 260128 | `b65215ffcc6233f05836e9b3b3962d71141789a977a8e40a25dfc9ee3ab0ab0f` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/crash-repro/zune-jpeg/zj_007_shifted_rows.jpg | 248468 | `f3d5d949019d76b3eb551fbb98d7496a782dd439824c07d7053aca764292790d` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/crash-repro/zune-jpeg/zj_008_shifted_rows.jpg | 276340 | `5a00bdfcdfab403d2f366bfca7e246373cc5bdb09a3a770a5e16f1606b0ff504` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/crash-repro/zune-jpeg/zj_040_decode_diff_2.jpg | 44768 | `d855337071633a0ddc956bd2886c85b73c1a401eb64bdf87dcc7ce72a7ef531a` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/crash-repro/zune-jpeg/zj_064_red_channel_shift.jpg | 78397 | `828881a491bc12db02b679b5ce232e77a1c6b1a81932b951990a51f3efe4596e` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/crash-repro/zune-jpeg/zj_067_no_more_bytes.jpg | 126695 | `3125bafa9aa26e58dc408f9b376f61f1b8c85a8829b4a113e22d54f05804dc6d` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/crash-repro/zune-jpeg/zj_104_incorrect_decode.jpg | 109669 | `8df37a1eb2ed28e8d0586261b08a1da090a5fd8f61ca8580c43943122478be4f` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/crash-repro/zune-jpeg/zj_162_mcu_assert.jpg | 503401 | `8c799bfa37e0e9469e5bd7a5cdabe54e9cf2faa576c186d186b9340bc95542c3` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/crash-repro/zune-jpeg/zj_167_marker_soi.jpg | 744117 | `cae7ae88149281f7bc89a7096c833d11897f41164ab237ef5cef72e7e81c41ab` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/crash-repro/zune-jpeg/zj_188_upsample_assert.jpg | 41462 | `17ff7369c3d6989b808a2355bc88e1e06567dd0d916ffa77f02a216011d84e5a` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/crash-repro/zune-jpeg/zj_207_mcu_range_cmyk.jpg | 9838677 | `3c8b37051add86b4488f458cf424b901fc23060b222f9487142c11cd858487bf` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/crash-repro/zune-jpeg/zj_243_progressive_lowres.jpg | 488301 | `352f82abf9d0c7b89fc0e9a181e6c2a0c867a6d06f8e47a2f7700c53f1a17989` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/crash-repro/zune-jpeg/zj_246_unknown_marker.jpg | 4989440 | `49af2503d4e73cbdbc89d9a44891c25864921c56862d49a17dd194c54925f5b3` | jpeg | Panasonic |
| imazen-codec-corpus/jpeg-conformance/crash-repro/zune-jpeg/zj_261_xno_p10_camera.jpg | 148108 | `c9ad3dd294557bb30070351fa98a4c0cf025fc56b54a3f77e8e2dc2421e21229` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/crash-repro/zune-jpeg/zj_266_exhausted_data.jpg | 155180 | `6c476e59ac215274abcd41b7f93b9755d775a63073372c8378660cc1e921337b` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/crash-repro/zune-jpeg/zj_269_exhausted_data.jpg | 1077710 | `2b8a86eea1db88b953e20a10b9209344c42771a3a9e6436c0da96a7838a124d9` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/crash-repro/zune-jpeg/zj_270_no_more_bytes_1.jpg | 101316 | `c603ae02aed9ce967a29e899ebf93174c518a18f951bbf5c05c42ae0a5e744d7` | jpeg | Apple |
| imazen-codec-corpus/jpeg-conformance/crash-repro/zune-jpeg/zj_270_no_more_bytes_2.jpg | 75275 | `ae5a5220b25fc1122d2ce77f4b02259048106fc2493519eebd418a057bc2256a` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/crash-repro/zune-jpeg/zj_275_cmyk_3comp.jpg | 456428 | `003ded628f208985674bd3962f57780376db76f5bf0fd8b82a44cc679d249f99` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/crash-repro/zune-jpeg/zj_276_vsample_not_pow2.jpg | 62956 | `30070c3c20c59375b70843bf731e1977ae3c6acf027aaa8301f1f4c1ae1ba7ee` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/crash-repro/zune-jpeg/zj_277_broken_decode.jpg | 185846 | `2d40fc58ef29ce6b81f296e860a8cf95bdffcd1fbad28fd007cf64c93784945f` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/crash-repro/zune-jpeg/zj_278_marker_soi.jpg | 229954 | `967f4b7cc715243aa37cc258a1373a4e5c3f3cec8b5c0fc9d05c2afa3e0bf806` | jpeg | Canon |
| imazen-codec-corpus/jpeg-conformance/crash-repro/zune-jpeg/zj_288_two_components.jpg | 162675 | `99041dc34b574872f498bdaedacc95d28ff366ed998121dd611b635ce70e7324` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/crash-repro/zune-jpeg/zj_291_cjpegli_incorrect.jpg | 102663 | `ec97ebfeaa727fe1e1980fe0c5fc86519d0e00748e026e7fecefe787539c9dc1` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/crash-repro/zune-jpeg/zj_292_exhausted_data_panorama.jpg | 7919810 | `b2030b51debd2112bb4685540d6f82919002ed24e24c4f2e52f30a2fde009d9f` | jpeg | samsung |
| imazen-codec-corpus/jpeg-conformance/crash-repro/zune-jpeg/zj_323_regression_arm.jpg | 487438 | `33b198a1d2839bb9ac4c65d61f9e852196793cae9a0781360859425f6022b69c` | jpeg | Apple |
| imazen-codec-corpus/jpeg-conformance/crash-repro/zune-jpeg/zj_340_decode_regression.jpg | 1676515 | `6036782a818637aa25ffce954d580b0bb0dbb1af7d189762766b8237cc0e0171` | jpeg | Fairphone |
| imazen-codec-corpus/jpeg-conformance/crash-repro/zune-jpeg/zj_341_noninterleaved_original.jpg | 162302 | `5388a8e75c5d4bd1f4d6934e0b87c35b26b4e3bdafa1e8e7f33926c641b5ee1e` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/138d3b9e0d9fbf641b8135981e597c3a.jpg | 9756 | `2f456d169902dd8ac9a03c39b4ebe1b45586ff25382a7fbf7a34307f6be5717b` | unknown | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/194531363df5b73f59c4c0517422f917.jpg | 613 | `d5913997c95958e8e48a4fd8efd1c73b8dcc434c59b8cd2295eb705f6bc779ae` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/1cbb1bb37d62c44f67374cd451643dc4.jpg | 20731 | `7b42873450fad46402fbcdab2463dc85067f14ecabdf2c222185190ad381aa89` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/2183d39878e734cf79b62428b02fafb5.jpg | 613 | `3af43e44b825d8953780fc5a86d749850730d6224a92932def5a8f4aeee834ba` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/21a84b8472f6d18f5bb5c0026e97cfaa.jpg | 1605 | `af35ad3a6d9bee81da672d7fdcf48c580129e46374bd5efd85c5981026fc72aa` | unknown | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/21ad703b38e2c350215bb92a849486f3.jpg | 14612 | `aaf2a65a4d76c030a343fe07f470d07bb5a880f70fc2472778e50a1d22a7eb0b` | unknown | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/255015e07b6f9137b53b0f97d67a8aef.jpg | 613 | `101714fd9d6a6b899dcbbc7d7d1a669b45f3b3fd8c788dec2885807fac29b22f` | unknown | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/28968137f4fc75fbf56f16d7a7a8551a.jpg | 357 | `713489d13c8d124ca9bf842c5256437c1dbb4c643eef4c3ba777dffd8f2e0a8e` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/28c74d9284d9836017fd519f6932efd8.jpg | 3933 | `0751354e158f6070c3a52a7175dac7ffb3e8e32c908a48560d4bf5c24f6a3055` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/2c9e7a1805f8b47630bbb83d21bf8222.jpg | 29311 | `924a8e97ffb28b6df4b1b3fb953f0340e63fb3a1ce0f8a5ac1a3b951917731b5` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/316be81dfdeeb942e904feb3a77f4f83.jpg | 49977 | `06239c321880733aad329338a647b565bf7321d74523ea3fc3b6ced45d7b2058` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/32d08f4a5eb10332506ebedbb9bc7257.jpg | 385893 | `e0dd0577b6df911c09b66d4fbc6cd90f5b1addff8f5c5c8412d5b2e3f537aaa7` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/3976a754ef0aca80e84e2c403d714579.jpg | 2242 | `7356432eac53a353e41322876bad6c0f1f2d71c74338a406a8cf4659bdbe5809` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/39f43f280b31152f1d27df3f9d189317.jpg | 613 | `348a10a3e30181727caae6f54908ccc3a52e96db5b6bc409b00069d28efa5bfb` | unknown | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/3ba6af611cc5467cfdbd5566561b8478.jpg | 613 | `9ba21ad17a30425d448a2ca37c14222763626958661b77a2ce4725e0fb3fcad7` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/3cc4a7fc6481ea3681138da4643f3d16.jpg | 613 | `21a8150e1a7c63bd0cf6a466301fd031ad2ccc14a8440dc8d6649fa290eca67a` | unknown | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/3ea649db8e81a46ca4f92fb3238f78ff.jpg | 1718 | `8cda7205902cfa7a1a4b2b6a1d369fc0f2bced2e1343d682855e7c2e21c1bfa9` | unknown | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/3ef05501315073d9d4e1c6b654d99ac0.jpg | 613 | `d43d85eb653d94d95b8390ebbdb35d1b2f573d4f7fe9b410484a25ba145294d0` | unknown | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/4085c929e00c446d3fee18b5b20a27f9.jpg | 1589 | `f79fb537acc5f685e05f172a6c0f99f59dbdb8849f76bf6f9f6b3870f259851a` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/40bb78b1ac031125a6d8466b374962a8.jpg | 179753 | `2b864e43dd51bf8ce8acfdc4e8260e2592c81803606e0633dee3d49619690788` | jpeg | SONY |
| imazen-codec-corpus/jpeg-conformance/invalid/46e5ac4a62d7a445a7c1fb704fafe05c.jpg | 1605 | `54a59280f81b4d9f9cb0b61ff2e5d002da00363d4a9f110c27358d994be5ccd0` | unknown | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/46f5d9c1b0fe352353688f736e5617b6.jpg | 613 | `cfd89d30bce7ac1edafc84a4b388bd332b98ef3d6cbaf9d29a8d9681f401e667` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/4838ece0d3900220d33528ee027289bc.jpg | 2973 | `79458c8f88ad6578c48f4a0e111064d24d4ddbb89c4781f33bf4632ca4a7593e` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/5315c35bbcc28d8eee419028ac9f38e0.jpg | 4573 | `0c4452a8bedb51654ecc3e851f4c86ab193feb46fddb76ccdb0f82377c98a030` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/5482a54657765056f1a94116a8dbffe7.jpg | 9756 | `5923f8287239cee495e487aefc72a9afe7c0f3812d4c9fae823dad5a9636003c` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/551c2656a4f6f9f5ea7e9945b9081202.jpg | 3933 | `a556ac0fe3f6f104a9397f0a212df1b3b30d9032149a3514ca2b9ef36a319235` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/5633ed9d0eb700d0093bf85d86a95ebf.jpg | 613 | `7358cd64db4d6a8a3979aa3d9839aaf36ceb47adaf1d3d47b0d21b51437ebd6e` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/56d4a1bb53241f7c5ed6ab531320a542.jpg | 613 | `7ac12d7f32ac75f4f8473bf5d7f7da1cf3bebfdc7b29be929a6a4fe073370a50` | unknown | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/59d3b529c78ac722127c41ba75b3355b.jpg | 613 | `17db8fd0414a267a87714cc9b47a19bfe2f6f03580cb0487a831af358d783291` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/5a43fa2cf9c1e47f0331ef71b928ee55.jpg | 613 | `a7203fd1cb40b998c761a61d613106a9986bce4a73e0092fe1de06d1c0cc14d1` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/5baad44ca4702949724234e35c5bb341.jpg | 613 | `e7e3c7fbe076e91c065627b3658645d2e36935ae35a4305ce9952f2c6892797b` | unknown | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/5bc61724b33e34a6188a817f9f2f8138.jpg | 613 | `0725abfbb273df5e9233c58949dcd7d5f00b0fce39202c02953e06b1d660d1dc` | unknown | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/5c67195f6993c9f8d0d32d4ffe0d8e62.jpg | 613 | `772e14596bfc88edb57d24cf97dd967d507ef279f1dce6ac1733719685286cbb` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/5dc71b1d868ef137394d3cc23abea65a.jpg | 613 | `5df52bfe801d3c43ff794a86b6de20d0ed56ac07e6362caae7f0b176f51c18a6` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/627c0779eb46b98f751187c5c9f43aa3.jpg | 14228 | `5313502fad7e64bf32c21a4d5213a22dfe098e1d79b6d9d65fb13dc6af4a9c52` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/6903d4538fd33c8fd0ded32cb30d618e.jpg | 613 | `d2e9c7b1c6f9fe867fc08cb0aeab1dd66f935bfca79fdc2fc62af92a9de3a3c5` | unknown | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/6de166ee2a3a60df9017650e2a808408.jpg | 357 | `c10b0f45e34aa80978ace6c017150c0006f9ad0a63a81975dedcc35e4965276e` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/72d091e08c93c9e590360130fa35221b.jpg | 11603 | `91ddbc86dd5da64ca2a8b780361146339e3df982092f97834cd78db1a832c6f3` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/754664a12e36abff7950e796c906ae39.jpg | 357 | `4585ff507f7914344b080fbb5bdd9028bcb68742a8ef96eb9335ed89420e0ce2` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/75e4bd7544a85af6438497980b62fba5.jpg | 4852 | `76e72e9a08cc7d7c18ff1a1f3061dc3808532fd8339449693f482f690daa772c` | unknown | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/786b67badc535fc95a4a76c29a0e0146.jpg | 613 | `e88f940cca761737ccc01ff3c249792eb4d3f3589f1923f3502341da3c9ee0ff` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/7997b6b229f25315d33f5c7085e37500.jpg | 29311 | `2e419b35944fb483383812f4508f58b8984d86c410f0347c00c1f4a2f386dc11` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/79f5fc6bca756e1f067c6fc83e18b32e.jpg | 7320 | `863a4c92c2a244da187b5c0ed29e618e4eb23358625ae951658f536333c442c9` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/7acc832f70b2ca62e58a953f3b90fd82.jpg | 613 | `9f95a7a2b7683f401085749508244d4712c23950062e593ac420b4d75f15c2cd` | unknown | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/7dbf474f80e466e9e25ee46b84166420.jpg | 613 | `b2f49b20e102ab62eed575c947168ba23e6e1393aeeeeafe86977b9c9f295f71` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/7e7cdf7f4ee50b308531313bbf43e0c3.jpg | 357 | `c59933a3f6e2b255893cd88534b83d2be7f0d5867c51a669c0a3aae0fc7281da` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/8417a305e3b43d5b1bda4ff06a660c54.jpg | 613 | `0405ae0279ecbb171b911a54b3e5a54dd5a07dcc858133a56d43d68f01c979d2` | unknown | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/8546907dbe574744d7fea6ca9de1de6b.jpg | 12633 | `28215c30315ee351629f18069b0d76e59327aa3456eac7e318300fe507a5222e` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/865db3dd2d380626f16b6f9dc6d62dba.jpg | 3802 | `0e333f7fa22fe0a080ead395fefa9d23db99072110b4371e1e581890f3d2b019` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/897b8b6d8feb466aa6cad5f512c3fce2.jpg | 1605 | `94e40af7e4ccf42d86d48e4e5c4cb662aafc5d65964d3dc4ef8e428db277cfee` | unknown | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/8a9cc8eeed66aeb423a91c44111d9450.jpg | 1133 | `dc6ab06865114d6f5b3ab7c7e06bd9a98867a9e76d95ee66377c96b1e8f40d4f` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/8e330afbd99ba01b66570ed62fcdc6ab.jpg | 357 | `b499a75238e84e0625452d44f2093dc8b356f646db06a0ef5de70c5625ef40e4` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/8e5e74dbf9b68a322fbb9512db837329.jpg | 613 | `9f6361d2247f8cd4c45b36beb62172e357d41bf6389be8357087ad36a606a54d` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/90e46387f562ca8fa106b51dfcda1dc6.jpg | 613 | `11b871414c0792b523e9ad1fe31c6230772b05b4de007d0bef32bbcdade763d1` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/96b3e939852157613fa2e48d58fe35fe.jpg | 5140 | `f698b68a1baf809c2e1efa2cd9c88f56a5a974a8af25d0d9c86f5bda590d36b9` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/9efd60f04cd971daa83d3131e6d6f389.jpg | 6327 | `9ce8c8eab2de5d910041bd098093d44a3e6e4c11af2cd3933aae4cdb927c0099` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/a17806f32b45d63eea5230e7893e1f15.jpg | 3446 | `f104a7a086e47dfef079fa75bb49a85438613b8c5e20c0e1478775a9a468328e` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/a54f8c866cbef6e6cda858c85d72dfc8.jpg | 613 | `94eb69cc07ddf3541adfa792b5af201b0893de0ad8f08e8c11335ac17d767124` | unknown | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/a7326ba8f3f4559991126474dd30083d.jpg | 1887 | `3cba70bcb4019d7e4a2ef279bf5fcf6c9c5db846ea4f31705a322103c456a7a1` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/acb1fac4e618f636d415f62496e8b70e.jpg | 613 | `be9734198f92847f441a102a194ba6074adb0f4ba3a34ed13a1cf82166d9ad6a` | unknown | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/acce3629083f0e348e94fb58f952d3de.jpg | 357 | `faad01436102e5feb50465165c67311bf20c936281bfb06e296783d7cc9e2e02` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/adcb34b94f4c839bdd29037419a0ee53.jpg | 613 | `1f0e3d0533f4e55efab139a341c3acb6f0d4f57c8a89bd44ca93c3321b9fc173` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/b0b8914cc5f7a6eff409f16d8cc236c5.jpg | 3944 | `a6e529cfba56a345ee467a0d3916131ebb809f682ef67b07b558f1de38fde35c` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/b4103df93880fc5677c2a081e4bfc712.jpg | 5117 | `6b540dfc7c3dc4a4573f810fe287e3328fa3b5df9f26e39bcab59a99f0c21582` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/b5369bcbddca7135a5708c5237ad64e4.jpg | 5645 | `6b36fe37aba3a4c95b7acc45113a053de87a2ec44adb14727267557a0b519878` | unknown | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/b55977028a3a574336966b6536640fc9.jpg | 613 | `6eded26e11c33a27a3edfe066191bc82cf561505538b8982fdfd9acbceeb24c2` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/ba60305ac83fe3d8ef01da1d9a0ecc79.jpg | 4852 | `0658d0c24f111696bedb6ac0792bea2a4807484fc96246ff38b9e61f1e1afab1` | unknown | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/bd8cf05698aee36b82b4caf58edea442.jpg | 613 | `cd939068eac6da62f684ea6b0a1e6f1d6aecb2b34645b278e139154d9ae5a54c` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/c1ca5583e4bfadc73e7fe9418b6e6bf4.jpg | 613 | `422a828aad488d415e06821e3360143c244fe9d4230b8d8986e4db60d0249887` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/c3018ebe53d0046eecb58858ca869a99.jpg | 67705 | `e7f7637a261eae7715e5120d9928f95267d5c559eb7d89a1c4dd9b8ad1c737fa` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/c4ced510f44a9bfe85c696c05a7f791d.jpg | 613 | `140b031f3b1caa17d3e1f95346a3759ac4ef7c48c7bab0cd5ad80a8cad460bfd` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/c52ffdd6a0346c4d09271f8ccbdfd5a3.jpg | 1161 | `50cb11767d6062ac3b24f68f018a755b0d2ab82c850f6905906d9ef2b2635fbf` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/c8bc97335529d069a753c67475b8c82c.jpg | 357 | `258e63889a251e0cfbdafdeca6977605cd90e9032e6d4d6a20dd57e7c937703d` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/c8c1a5675f82021d92b928a10c597bad.jpg | 613 | `1e8dd50c4ffdb64582b00e0634ac17c4e7b3dc9f29812875295cf66d380b161e` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/cc23dd79637b606cf5ba234a037e17ba.jpg | 357 | `6424e84708e0a2dd025ca656607525c07e5e9711b732cbf6895b8ef04f68cd89` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/cc4ee796d16c9fe68978166c7cd1ae1b.jpg | 613 | `7bccb5e192bc9a9c9157cb88966ef13b059be34bf846d00279517f5851c307c9` | unknown | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/ce380515a534e8226209daae00e7b4e8.jpg | 613 | `3c4928a2f5abaac2443e77d2adeefaa7c3e7e40f1700fdbfa8577e285ebb7c24` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/corrupted.jpg | 1960703 | `dcc801f45d7607d82661d08c4c6b188bdbf3129b55f7612830a6dc3fea573023` | jpeg | OLYMPUS IMAGING CORP. |
| imazen-codec-corpus/jpeg-conformance/invalid/d085a42245996e5750a30ccb48791bcf.jpg | 6327 | `da3cb150219e11be54bc7dd27333123909f6ca8100e0d3332e6af0c07a876a7c` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/d15b71b8cebe35a57cc6e996cc09218b.jpg | 3255 | `c9f40a06fc2c7b6bea17dc9b010877cc6e243d0981e3c9ae24d68e7d8c3be5d2` | unknown | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/d22db5be7594c17a18a047ca9264ea0a.jpg | 540458 | `ff20d5d0ad75e648b1ea388f65fb41d02bd2a049cd22ef86a4648b357bde94ce` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/d3b044a94486cae0224c002800ddd642.jpg | 613 | `9539695c666b2634ff88d20de4d101d24fda3428ee0be892fba4c2f16d540889` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/dc-predictor-overflow.jpg | 1940 | `94f3270e02c0bb6816cf81f35a3398821fce968ee7e65a8b700c71d4bac43d49` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/de4ae285a275bcfe2ac87c0126742552.jpg | 357 | `dc1c7833be3115c45b940a0f376053648e23a4418852b7621ef71742edf37dba` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/de5884cec093257d239f3b8be3e2f2e5.jpg | 613 | `f41a0d816c98cc6794d2eab652bf748f1d84b7ecd850f3093e06956d31aff151` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/derive-huffman-codes-overflow.jpg | 6354 | `22d1f5a1d4338ac29982f8779bb97dbb9c855e578ecc18a57d35b3172fd8e329` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/e18bb52107598f65b81b02be2c6c5124.jpg | 357 | `5b98abacb4884c034bda748e15d2d8108a47c85ca5f9cf3d5a3661b186807497` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/e6d9eca2c7405e13cfb850b7d0ef7476.jpg | 613 | `48d7213ac904b19b6a29e261bafb9135b88a7ea38000ce4dc79d3143ec4d2607` | unknown | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/eddea4ef9629be031f750a8ff0b7497c.jpg | 613 | `90805d49071b93cf6474f488da421f015b2a2e5334f31e6f0571665ab22a4d10` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/eecb78b937a7c5f04aae2f5b0f5b5acc.jpg | 613 | `8adbf4529865d74853c2456dcc706060415df611e1d64e9c81e2c64c986d2c36` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/ef1f8a057bb6056674fad92f6b8c0acd.jpg | 9756 | `7e356f5e21a433a267d51baadd8b6a63d0027ba84275a57f89cce7dffe9c185f` | unknown | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/ef724193653930f52acffa90e6426fd2.jpg | 5562 | `55626a0b5b798a3fc1fce8a8c68097975c9ee6a4d02aabbfb798242d080615fc` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/empty.jpg | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` | unknown | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/f006e96f3b27fdfaa075322d759ea2e8.jpg | 28011 | `f90570498ff036f4d1d6cd174387d66cea5ab3cef4ef13f38397699e8d285ae5` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/f012a4321f00f12af6b1eee7580ffb9c.jpg | 128 | `e56b313589964031625334312dbc1f3201d102b4fd723d4b712492010af82cea` | unknown | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/f1fad47f213bb64c99f714652f30e49e.jpg | 5006 | `47a257db2afd90d815da71a39f62987c404daff666ebe0b6b90d78027943c008` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/f6419b06a39ff09604343848658b1a41.jpg | 12633 | `d9a6471d6cfc036fce5009515d65274c37ba320e04e53773372d7df08432af50` | unknown | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/f6b4389c3cf0f5997b2e5a4b905aea8d.jpg | 613 | `cae34b16aeed94ca36ed577413d8f109199607e29db7687c4a5e6622e6f11fd8` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/f6d3f522dcb693d9e731d5a0fb4e1393.jpg | 14216 | `9f859477e8762b9ef88e02e133fa516d2abffb791e874380d888ffa9101bdc24` | unknown | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/f8e19feecd246156b5d7e79efc455e99.jpg | 613 | `dde163ddfa1613fcd010effa345286bfd1e3725ffffe50530eb8687a3a187641` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/fd44dc63fa7bdd12ee34fc602231ef02.jpg | 613 | `e50e56b489eb603fd70907be8984b901cadabf92c68aec04b2f26c57a94648be` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/fddcfc778ada60229380c2493fc4c243.jpg | 1125 | `7bcfb421b8a1e3c5054f90815cf331b3f08aa9f4889edcec7358b1940280e750` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/image00971.jpg | 164210 | `4793aef30d2d042f15723bf22fa8c5b9932c6b5e97bc090e7a82c0845b2a47db` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/image01088.jpg | 87107 | `99366772dd3e323d52bf6667b2955c8a2859f0ba9d88d96c2c0a0ade16d96d9e` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/image01137.jpg | 26898 | `d28160c63cbb4c9a9709e917b1bf0208d6240d1d3e22b28ec23abb08f957c52c` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/image01551.jpg | 15994 | `ef8e654304d58238af70f4ba8f52b095c8d801ebba0dfb6b089b53d835c36c5a` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/image01713.jpg | 17412 | `5281b682dc913fee5a3b7d172bfb8c8068a1bcc3138c3d29f98db34bc807798c` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/image01980.jpg | 17857 | `0eda850fefce6ae4c148815bfb20962309b75e542de421845615ccef7a962f00` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/image02206.jpg | 14574 | `527ae341310acbdeedf60d1087a23081ed279e3e6ecdd7e4b82d586acfbc0735` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/invalid-dimensions.jpg | 855 | `56e9e75287d4baedc54a0b85b967bcb708965f9583380f41d9e3f6fb97ac4ce8` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/invalid-prediction-shift.jpg | 3860 | `6b2d0e374b216ea8d2a4dc95745164871d5c83d7cfaa4e40e79c22e683b195db` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/max_size.jpg | 186 | `4d88e9b396f8d903663428f480bd85278edfad16c92fb48f6dee19d7f5798f28` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/missing-sof.jpg | 8 | `e9ef86bdf43856f5b290bf08886b56470c716665acf610b0a248175f56b29188` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/missing-sos.jpg | 104 | `a355e29fd9194625b0cb1286d759d70cc49ee8b14eae48a9da473094f86bba67` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/null_height.jpg | 186 | `ecf8b7f1620d5058856ad1f2dbb82c99b0582b2f0a6a2364ef40071386f181ec` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/invalid/subtract-with-overflow.jpg | 36889 | `22822b8d6a4bf2b70b6964972a6e9001329d63da35558c1a0923e3cafc839385` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/non-conformant/extraneous-data/extraneous-bytes-after-sos.jpg | 397552 | `9c80595d322a41fd1eae35a5b6898c23f484694d34dd36d07c6c81529c69273f` | jpeg | E75046D8U111299 |
| imazen-codec-corpus/jpeg-conformance/non-conformant/marker-quirks/multiple-0xff-before-eoi.jpg | 14208 | `517df4d1161cda83c5a20075d4a1d13292dfdada7d40750ebf7abdaded249838` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/non-conformant/metadata-quirks/icc_chunk_count_mismatch.jpeg | 5456 | `ed201e1c2e2dc4068ce19ad835e9c6ce200d5eccada34a843fa3a45dbbe7c620` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/non-conformant/metadata-quirks/icc_chunk_double_seq_no.jpeg | 5456 | `1323239d36f5b1817c914e778b10039e0e4c41fd9366a4119d8a5dea5ce4a0a5` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/non-conformant/metadata-quirks/icc_chunk_order.jpeg | 5456 | `0985c39131579d52a990db10e70edd625abe8892d43292a584b0637e42629c4d` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/non-conformant/metadata-quirks/icc_chunk_seq_no_0.jpeg | 5456 | `804b1d35bca1ad60959d3addd7cee439808bfbc823d48ff477094a4863263659` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/non-conformant/metadata-quirks/icc_missing_chunk.jpeg | 5437 | `1381ae91cf0ad99c8b128218f3574f90d18ff8af169915e5242d3dba7f3a780e` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/non-conformant/progressive-quirks/mozjpeg-rs-ac-refine-q95.jpg | 4473 | `f41571b44c37fad248526fc1a62da2142f2f4037673a1edf8d63e8c486198e02` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/non-conformant/truncated/after_app0.jpg | 20 | `a30f31a6a61325012e8c25deb3bd9b59dc9a2b4350b2b18e3c02dca9a87fea0b` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/non-conformant/truncated/after_soi.jpg | 2 | `71563ad80061407ede9c6f316836284bd3710a520c5a792b5eda1cb703690815` | unknown | unknown |
| imazen-codec-corpus/jpeg-conformance/non-conformant/truncated/after_sos.jpg | 600 | `d7748f9e73be22d6237a825b25423c53385fd258ac057deb68074949db6e8729` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/non-conformant/truncated/mid_header.jpg | 200 | `d58771ddb27be53bc9f7e824c2767f3245e958f62ef8a3005fa64d3a20c674f2` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/non-conformant/truncated/missing-frame-image-1410.jpg | 4 | `32461d5bd1773012acef0ba15636752949bd7c2ce50f9172159d9f56cf0dd9af` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/non-conformant/truncated/missing_eoi.jpg | 5768 | `3c50d9293a5dfdbc5d973207eca1cef01cbb28e2b1b808381a3ce8299046966f` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/non-conformant/truncated/progressive_25pct.jpg | 1439 | `4d135122d6f14899f9f1b743d2206be05dc77f63fe84a43da9d18044401eef86` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/non-conformant/truncated/progressive_50pct.jpg | 2878 | `6f344dafed741dfdf030d8101e2bf78d8f870b46667a5900fa1ef300e88cdb25` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/non-conformant/truncated/progressive_75pct.jpg | 4317 | `7475d96061d39dd64ddad6e9381bbb0fc1dbb67c930ba535795ecef1772fe9c9` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/non-conformant/truncated/scan_10pct.jpg | 577 | `131f32ea54d1804fb80af2e710c298ef6305823d396956423817cbe307240ab7` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/non-conformant/truncated/scan_50pct.jpg | 2885 | `bba92b6a2704d331748a06d99afd14f087e60bb1881383d4661446d6d6d583ef` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/non-conformant/truncated/scan_90pct.jpg | 5193 | `e0742f7b920e12c9f26852a171ddc5c9fc226fd9a9f2eef54ec86fae082e7fdc` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/valid/16bit-qtables.jpg | 758 | `361b5310287d576ca9d0b87b3999765e80baac2e92dc46438daaf33b2874322b` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/valid/Canon_40D.jpg | 7958 | `6bfdabd4fc33d112283c147acccc574e770bbe6fbdbc3d4da968ba7b606ecc2f` | jpeg | Canon |
| imazen-codec-corpus/jpeg-conformance/valid/Fujifilm_FinePix_E500.jpg | 2241 | `ffbee7b07bf267dc0fb52817f8866df647758f7d48ac93e7a73d1914fb4c74da` | jpeg | FUJIFILM |
| imazen-codec-corpus/jpeg-conformance/valid/Konica_Minolta_DiMAGE_Z3.jpg | 36971 | `b1b914f47528384e6252fa7caabb489f123b88c81ebd62ecb8eacdf64c46fd5e` | jpeg | KONICA MINOLTA |
| imazen-codec-corpus/jpeg-conformance/valid/Nikon_D70.jpg | 14034 | `8e2a627b96ca71c20129161f46bda3d338407da99bd11b1055adb27af27d7ef5` | jpeg | NIKON CORPORATION |
| imazen-codec-corpus/jpeg-conformance/valid/Olympus_C8080WZ.jpg | 3224 | `3495de26279d8d1e442177ba43cef855438e3b321481b9ee2ff513decb13ed9c` | jpeg | OLYMPUS CORPORATION |
| imazen-codec-corpus/jpeg-conformance/valid/Panasonic_DMC-FZ30.jpg | 10769 | `c092a4ade7ae7b63ac13d50c3dc9da51ce2fb465caf7d1b6193d4c53f59e8ad8` | jpeg | Panasonic |
| imazen-codec-corpus/jpeg-conformance/valid/Pentax_K10D.jpg | 12077 | `146601c9d406410abdaa832508ee4ccddbc7ad54530e81d57962c1b7728e2e6d` | jpeg | PENTAX Corporation |
| imazen-codec-corpus/jpeg-conformance/valid/Reconyx_HC500_Hyperfire.jpg | 425890 | `d7ba6bc532a225c955411cb96c733a45ee39403fa973312bded7732e6f8e4b3c` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/valid/Ricoh_Caplio_RR330.jpg | 3662 | `e920d750c491f3088eeb0f31fb4659164755af11e4bbbe269430f32c3ae10928` | jpeg | Caplio |
| imazen-codec-corpus/jpeg-conformance/valid/Samsung_Digimax_i50_MP3.jpg | 45286 | `e61da5ee8d7ba1726bd0a887216ed5ae7ca38c97fcf7aac11b808e1c269e1722` | jpeg | Samsung Techwin |
| imazen-codec-corpus/jpeg-conformance/valid/Sony_HDR-HC3.jpg | 3565 | `4f707d9b40d423a5246748bc1e05b66c4b87e30863f7a51ce18904a7ec43a39e` | jpeg | SONY |
| imazen-codec-corpus/jpeg-conformance/valid/blank_800x280.jpg | 1036 | `78509405d9c6cbf9ee6393e0e74731e34fa0bc3efcc55a84c89f52707b8643cc` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/valid/cmyk_logo.jpg | 164662 | `1ebe10e651c34c8cdb42c3559bee1ce5d1918af611d1dc4238dc6dbf1792e550` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/valid/cymk.jpg | 96660 | `4257eeb390b6a5145ab31046bfb1ebcef690cf80e2fce10b26f988c3cff4084e` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/valid/extraneous-data.jpg | 449 | `fb1038d735030426cc05deea8e073628b0bc31438b208be4773d453fad8609ef` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/valid/grayscale_16x24_sampling2x2.jpg | 571 | `b6a104d1d022554023fc3208bf14b56c6e1caf163b48620e43b6a10b89a14027` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/valid/grayscale_24x16_sampling2x2.jpg | 568 | `22c80daf3c6308d954797e7ff7a72443458ab1ffcf1265039218ea5c905d2163` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/valid/grayscale_large.jpg | 1397 | `944bdb5edaea4065676e26681f779d24d11ff56bc7395411b53163d1ec9ae526` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/valid/grayscale_long.jpg | 1481 | `c75b33df68ed283c3f45351c6c966cc99b3bce99ae94d06199daff8f1ca8dfc8` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/valid/grayscale_square.jpg | 331 | `b300b1182487aaacd944e86b58cfa9b5a0349c65f16d7cdb32ec783cf02d3604` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/valid/mjpeg.jpg | 122041 | `7762b7960f899868bf60dfbb0b8a66e5563b040b9d889c1c097bdf938ce972a0` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/valid/non-interleaved-mcu.jpg | 572 | `5abd83bf44756cb67018ef8b452c31a709146706e9c71800cd24628cce3ef9c4` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/valid/partial_progressive.jpg | 1330 | `3b809d450dedbe4fc8b12afc57e64f296eee89ae61e69563e7b44e4e9049e7d9` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/valid/progressive-missing-ac.jpg | 139 | `ab24ace780b7efb1e74b58d4a87bcd9d4753a5b71a4b4552043fb83ba8e24cda` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/valid/progressive-missing-dc.jpg | 139 | `102f457601e15b5d44c6afad9d8a79e32338081012deb5878e46a65b859c3a9e` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/valid/progressive3.jpg | 91072 | `d19ebc7245629cc1e55cd0876fe671bde324893e73a75f3c467b8b4991214837` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/valid/progressive_rst_420.jpg | 479 | `db57ee4239f9e6330421d60e6fd07c925ea06eebc48af0e3796951e7b0bcc5bc` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/valid/restarts.jpg | 1438 | `938a8107def3aca05261dccbc91a29cc31e98688c90f3ede200cb3f142030e8b` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/valid/rgb.jpg | 148263 | `35f1fcee1a93fbc6e30a945c661fd966e0962f60e0ef40729b8d9e76cabaadfc` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/valid/rst_16block.jpg | 1074 | `5aa9e3adc19f727b1e2cbc9aa023ce7689ff7f6e00b14038e3413443c324c9d3` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/valid/rst_1block.jpg | 1141 | `3e35d1a026a1bb7cb6f45fc85f9402593a0fe4ea018bfbe501a353c4ea59be8a` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/valid/rst_1row.jpg | 1092 | `95e3a3afa28e682f7a01dca95ed950bf10ea3df2cbfdb4e154f2b2c13ad0b3c8` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/valid/rst_2row.jpg | 1080 | `030ae8e0a331de8f937f4c0e3578e1c133fa5004229635eccd45f3c2d628e308` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/valid/rst_4row.jpg | 1074 | `5aa9e3adc19f727b1e2cbc9aa023ce7689ff7f6e00b14038e3413443c324c9d3` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/valid/rst_8block.jpg | 1080 | `030ae8e0a331de8f937f4c0e3578e1c133fa5004229635eccd45f3c2d628e308` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/valid/testimgari.jpg | 5126 | `4672c7f08864cd0a8c73a4fa4b66ca32b635d38464551c1ecf06564ae8c89b38` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/valid/testimgint.jpg | 5756 | `491679b8057739b3c8e5bacd1e918efb1691d271cbbd69820ff8d480dcb90963` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/valid/testorig.jpg | 5770 | `acc6ec555d41d15b368320edaa3b20958ee6fa97cb6e4a18d1213d5ae8bec73b` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/valid/testorig12.jpg | 12394 | `34790770f76db8e60a7765b52ca4edf5f16bc21bcb8c6045ca2efef39a8a013e` | jpeg | unknown |
| imazen-codec-corpus/jpeg-conformance/valid/ycck.jpg | 731616 | `3a17e3cca71f580d84ce054a5dd7e303766b3448a76d4583923f615a5eb5eb48` | jpeg | Canon |
| imazen-codec-corpus/webp-conformance/sources/src_checker_odd.png | 405 | `f228ebdb20330afe04db4cc60ac182d2c95dfc588e78c786462ef92699384bf5` | png | unknown |
| imazen-codec-corpus/webp-conformance/sources/src_grad_16.png | 88 | `39423039ce55b9dd52d4a287c720351a50727c2fec7433f66489314c1d3ffd4d` | png | unknown |
| imazen-codec-corpus/webp-conformance/sources/src_noise.png | 11850 | `b9a5ff91aee911b36d4b196b93bb2ee28d8e994c9639d5ec79ec62618acfec82` | png | unknown |
| imazen-codec-corpus/webp-conformance/valid/2-color.webp | 314 | `284ddab37b3cf76424a5a9a32351a84e815a0972f4bffd68571f6f67874c38d3` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/advertises_rgba_but_frames_are_rgb.webp | 52286 | `5fd83430e1dca3ffcced5bcac452147f30296ab83cae00d84603959ba96abfb6` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/anim.webp | 10818 | `459d0f8601844487cebd09dd11d0f50346fa45820bb7a7d817140dcc811496b4` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/lossy_alpha.webp | 1288 | `8d5b0f27f821d87106ed178831a9e62c95c09063e515b5d2ca89ad215547879f` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/multi-color.webp | 154746 | `6c1d82198912f1b07c81ce8ccd9fecb5825ec07fcdb42c352703e208cb2ea8d0` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/simple-gray.webp | 1236 | `e8c20d94a8f2c7a86d82d394708169bb3637b35c5338faac7154eb7af1ce8c43` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/simple-rgb.webp | 2184 | `76ef749015935542838ffda9df014b823d4153a7ffeab09fd5670ef4e7fa0386` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/simple.webp | 44776 | `16dbdf943d5281fcc58758e278c703a61f9a7ef572343178948637ee4135880a` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/simple_xmp.webp | 47662 | `39ca67e1c836ace4c12dc84dc8ee599eef8c2de8134a7470795cbd89b1035d75` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_checker_odd_q0_m0_def_def.webp | 178 | `2178c705d746513d97e9d9bb1aeee217085bc41557a812a658ecd92d78defcd8` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_checker_odd_q0_m0_def_segsegments2sns80.webp | 178 | `33fe91a278b76fc7c5ad8b819bf8363346482edb75c6460137dad84874032eb9` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_checker_odd_q0_m0_def_segsegments4.webp | 178 | `2178c705d746513d97e9d9bb1aeee217085bc41557a812a658ecd92d78defcd8` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_checker_odd_q0_m0_ff0_def.webp | 320 | `b5d00e144f5d845f32fe0f0fa613cc1b566e7cd4e9d64152c2f26b9248bcee48` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_checker_odd_q0_m0_ff0_segsegments2sns80.webp | 320 | `3ba074d72a0dc125f2750aa7f1ec82d04151cdd7485037638a4e58c4f6555ec0` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_checker_odd_q0_m0_ff0_segsegments4.webp | 320 | `b5d00e144f5d845f32fe0f0fa613cc1b566e7cd4e9d64152c2f26b9248bcee48` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_checker_odd_q0_m0_ff50nostrong_def.webp | 178 | `e7423b7e35575b5c3e89029ec9ee480199e86fcf5f790ab3325cde26d6e5df44` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_checker_odd_q0_m0_ff50nostrong_segsegments2sns80.webp | 178 | `6776c474240b40ee46ae0c1330ab9806b99dac1a828ef243490dc288a35fc31c` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_checker_odd_q0_m0_ff50nostrong_segsegments4.webp | 178 | `e7423b7e35575b5c3e89029ec9ee480199e86fcf5f790ab3325cde26d6e5df44` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_checker_odd_q0_m0_ff50strong_def.webp | 178 | `da4d18df3d525b7f98705e05f24e23925cb216b55d800c8c1c9c0df577ba94ad` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_checker_odd_q0_m0_ff50strong_segsegments2sns80.webp | 178 | `5b82a5c5ead8aed691541a9311886f3c7b0977eb69c0a890e78b19696db152c4` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_checker_odd_q0_m0_ff50strong_segsegments4.webp | 178 | `da4d18df3d525b7f98705e05f24e23925cb216b55d800c8c1c9c0df577ba94ad` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_checker_odd_q0_m4_def_def.webp | 176 | `b9c887f3b571fcc99cec7a36ce6a64556811e8a834c12491fc2ddee133391f2d` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_checker_odd_q0_m4_def_segsegments2sns80.webp | 176 | `2173004f622ce7c65332aab19118fc354e953bd14767f8b34c72686e6926e7b4` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_checker_odd_q0_m4_def_segsegments4.webp | 176 | `b9c887f3b571fcc99cec7a36ce6a64556811e8a834c12491fc2ddee133391f2d` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_checker_odd_q0_m4_ff0_def.webp | 168 | `dca7c5509e3de2846d8e349dc0b95558f1635fd550d5ea6636f1a83cd59fed37` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_checker_odd_q0_m4_ff0_segsegments2sns80.webp | 168 | `606a8b8682d4356ae40c51d32127212b5c07f70635994167ead53705568cdd50` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_checker_odd_q0_m4_ff0_segsegments4.webp | 168 | `dca7c5509e3de2846d8e349dc0b95558f1635fd550d5ea6636f1a83cd59fed37` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_checker_odd_q0_m4_ff50nostrong_def.webp | 176 | `9a7bdea755716d5f75b0dd270674b8806a364210b799087bc636f343c75f0536` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_checker_odd_q0_m4_ff50nostrong_segsegments2sns80.webp | 176 | `c711922cf41a364d42012ca692f14c801a6027f2ec77d6dac3cef90d97036039` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_checker_odd_q0_m4_ff50nostrong_segsegments4.webp | 176 | `9a7bdea755716d5f75b0dd270674b8806a364210b799087bc636f343c75f0536` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_checker_odd_q0_m4_ff50strong_def.webp | 176 | `9744c080075cadf486a284c27495400394c573c376fd2a778b9b579f3c5e4e8c` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_checker_odd_q0_m4_ff50strong_segsegments2sns80.webp | 176 | `1206551838d85fb83835d3283dff376a3ed6e0dd05f712d62c21c7fd655621a3` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_checker_odd_q0_m4_ff50strong_segsegments4.webp | 176 | `9744c080075cadf486a284c27495400394c573c376fd2a778b9b579f3c5e4e8c` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_checker_odd_q50_m0_def_def.webp | 214 | `928db980b98ea431e22dcab0e0b8e867adf31e14b823c532f75d457c3c704bb3` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_checker_odd_q50_m0_def_segsegments2sns80.webp | 214 | `cb134759a5cd066f9f1d1091675798f882f9e6ed423beb2a98d3ecf9b212b898` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_checker_odd_q50_m0_def_segsegments4.webp | 214 | `928db980b98ea431e22dcab0e0b8e867adf31e14b823c532f75d457c3c704bb3` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_checker_odd_q50_m0_ff0_def.webp | 210 | `a5b9576a02e279f5ee66a04c2bf296d7a07dc09feaf5eaaab4e8d298929c7619` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_checker_odd_q50_m0_ff0_segsegments2sns80.webp | 210 | `acacd6958e5220f48c6c2be7cd02a2a6a66ab5d02054019758eebda4740e9428` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_checker_odd_q50_m0_ff0_segsegments4.webp | 210 | `a5b9576a02e279f5ee66a04c2bf296d7a07dc09feaf5eaaab4e8d298929c7619` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_checker_odd_q50_m0_ff50nostrong_def.webp | 214 | `396fcde32297e8d0d24715e49f4c32bbb3c7711791f8ecb2c654616a9ebf7817` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_checker_odd_q50_m0_ff50nostrong_segsegments2sns80.webp | 214 | `4658e6113924d93d70f8ef65966c35dd4894d3c426a24054dc0e24161bd913d0` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_checker_odd_q50_m0_ff50nostrong_segsegments4.webp | 214 | `396fcde32297e8d0d24715e49f4c32bbb3c7711791f8ecb2c654616a9ebf7817` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_checker_odd_q50_m0_ff50strong_def.webp | 214 | `c259cc1658d88047b5aad4abbdf0403843adaa7b76b7408a53016fe69238d6e7` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_checker_odd_q50_m0_ff50strong_segsegments2sns80.webp | 214 | `43de3c129fb86289eabec5d1cac332aeac3823c2b1e8f105a1cc520775cb69de` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_checker_odd_q50_m0_ff50strong_segsegments4.webp | 214 | `c259cc1658d88047b5aad4abbdf0403843adaa7b76b7408a53016fe69238d6e7` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_checker_odd_q50_m4_def_def.webp | 222 | `38f3fbbe468b00c35f6f94e0c273654e85e9898759ebaa9860c86b4b4b35f9da` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_checker_odd_q50_m4_def_segsegments2sns80.webp | 222 | `79ba47e5e9f781c9eed1cb1be164a1711ededdbcb918e6f980f1144b1c924066` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_checker_odd_q50_m4_def_segsegments4.webp | 222 | `38f3fbbe468b00c35f6f94e0c273654e85e9898759ebaa9860c86b4b4b35f9da` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_checker_odd_q50_m4_ff0_def.webp | 218 | `03a45dc551bb510d22605f3d33c0f40ff940765eb32ee87f08543c6e169f4dd1` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_checker_odd_q50_m4_ff0_segsegments2sns80.webp | 218 | `1d852bd2a45470994ffef5f37e91804f935f60e3d26307a6315b171aec7846e5` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_checker_odd_q50_m4_ff0_segsegments4.webp | 218 | `03a45dc551bb510d22605f3d33c0f40ff940765eb32ee87f08543c6e169f4dd1` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_checker_odd_q50_m4_ff50nostrong_def.webp | 222 | `9c0620940640797cc10f8b849d5ba6f889e7da0ae5834f813d05349f30a2eef7` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_checker_odd_q50_m4_ff50nostrong_segsegments2sns80.webp | 222 | `557be0aeb75adc9a3b9af3083425bd5a6ac579d902fb451bc8625f0d8d602552` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_checker_odd_q50_m4_ff50nostrong_segsegments4.webp | 222 | `9c0620940640797cc10f8b849d5ba6f889e7da0ae5834f813d05349f30a2eef7` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_checker_odd_q50_m4_ff50strong_def.webp | 222 | `3479df25bb767e830d0ac76bc1c56b54b3fdcf2029b1721c97968706513052e2` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_checker_odd_q50_m4_ff50strong_segsegments2sns80.webp | 222 | `7f3133cb02d71c8b7cae18cf36b2a94e661e4e1969f05cf335ae9ab5ac995290` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_checker_odd_q50_m4_ff50strong_segsegments4.webp | 222 | `3479df25bb767e830d0ac76bc1c56b54b3fdcf2029b1721c97968706513052e2` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_checker_odd_q90_m0_def_def.webp | 896 | `c78e79b22f91629d4f1fb8cd5103091ed1125f96d2de25701c006b1b2b3969b9` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_checker_odd_q90_m0_def_segsegments2sns80.webp | 896 | `bbdbe38863b697c0ad3fbc6274ae87a7889a4c2c2ac5e38fb86357de5ea01af8` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_checker_odd_q90_m0_def_segsegments4.webp | 896 | `c78e79b22f91629d4f1fb8cd5103091ed1125f96d2de25701c006b1b2b3969b9` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_checker_odd_q90_m0_ff0_def.webp | 892 | `cdc5bc75b4c20f41b99a677714f4c1d3649d5638acf62d860e2e5bf774946118` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_checker_odd_q90_m0_ff0_segsegments2sns80.webp | 892 | `4828ebc6c7e9a902dd757939fec30ff1e0556f462f1584ea7cc5d380e48cc470` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_checker_odd_q90_m0_ff0_segsegments4.webp | 892 | `cdc5bc75b4c20f41b99a677714f4c1d3649d5638acf62d860e2e5bf774946118` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_checker_odd_q90_m0_ff50nostrong_def.webp | 896 | `9e38be6d9fab1a1f97e5879fa67ce97bcff565f7c527373a5d6a97296b5b2f2e` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_checker_odd_q90_m0_ff50nostrong_segsegments2sns80.webp | 896 | `33f387b3d7fcf5d46824b482ccbede1b8f7f07c15a3e0db1305cfee0881c9086` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_checker_odd_q90_m0_ff50nostrong_segsegments4.webp | 896 | `9e38be6d9fab1a1f97e5879fa67ce97bcff565f7c527373a5d6a97296b5b2f2e` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_checker_odd_q90_m0_ff50strong_def.webp | 896 | `4df818cc71aa983d0513d38ec96cb7dd3e35479c549488eed250c6d17e39227f` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_checker_odd_q90_m0_ff50strong_segsegments2sns80.webp | 896 | `10ebc2b447cd20686da8534626a7e77d6c65949f23bc9359ed8693c875766f15` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_checker_odd_q90_m0_ff50strong_segsegments4.webp | 896 | `4df818cc71aa983d0513d38ec96cb7dd3e35479c549488eed250c6d17e39227f` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_checker_odd_q90_m4_def_def.webp | 260 | `d6fc0822ed69bcacc3f2682aa60faff5f7aa5e2eec06a6ae3b00a1b652446d39` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_checker_odd_q90_m4_def_segsegments2sns80.webp | 260 | `a15d3ce091c7e4d7592a0b94c038f482a2cd6302d23fcb6e86bfa5eda074a04a` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_checker_odd_q90_m4_def_segsegments4.webp | 260 | `d6fc0822ed69bcacc3f2682aa60faff5f7aa5e2eec06a6ae3b00a1b652446d39` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_checker_odd_q90_m4_ff0_def.webp | 258 | `ce41438b259a409d1e50df964343d1e572cf403ac081363b7df730c06e287d47` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_checker_odd_q90_m4_ff0_segsegments2sns80.webp | 258 | `9e10df003ca946bde2b9f4c3f03ede4a713d706f5c6248cb6cd5c649c216183b` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_checker_odd_q90_m4_ff0_segsegments4.webp | 258 | `ce41438b259a409d1e50df964343d1e572cf403ac081363b7df730c06e287d47` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_checker_odd_q90_m4_ff50nostrong_def.webp | 260 | `8359081a1636fe3e098be4f2153f4dfad03e7124feabbab57c07d40c8da4f3f5` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_checker_odd_q90_m4_ff50nostrong_segsegments2sns80.webp | 260 | `0ad066338d4517b179db383c68c3b2e010c1bc91d1fbf7b84d504b317179113b` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_checker_odd_q90_m4_ff50nostrong_segsegments4.webp | 260 | `8359081a1636fe3e098be4f2153f4dfad03e7124feabbab57c07d40c8da4f3f5` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_checker_odd_q90_m4_ff50strong_def.webp | 260 | `07bca59a9f93958a46983e331b2e585ce2145dd6fa64f2d226c9a498ab287b52` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_checker_odd_q90_m4_ff50strong_segsegments2sns80.webp | 260 | `2c0761be7c577c875f9d04467139c2b47c20f916566337595fdb15cfad8e3184` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_checker_odd_q90_m4_ff50strong_segsegments4.webp | 260 | `07bca59a9f93958a46983e331b2e585ce2145dd6fa64f2d226c9a498ab287b52` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_grad_16_q0_m0_def_def.webp | 52 | `710475650cd9e7345afd5508354ebe26f596c2901f155b6ec1e3b2427b69ebf8` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_grad_16_q0_m0_def_segsegments2sns80.webp | 52 | `969187061bc4fb5ca79a1c6cd417a381f9e863da63bafd1a593354af2d444f03` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_grad_16_q0_m0_def_segsegments4.webp | 52 | `710475650cd9e7345afd5508354ebe26f596c2901f155b6ec1e3b2427b69ebf8` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_grad_16_q0_m0_ff0_def.webp | 52 | `74ed04e0e94d3ab63d2813d16d9a74a611c0979c62941a73d5f5d83112a71c15` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_grad_16_q0_m0_ff0_segsegments2sns80.webp | 52 | `5053a3acf09e983b7b190ddf165374f1b77a5e98c87998ae00747e7f03d84cd8` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_grad_16_q0_m0_ff0_segsegments4.webp | 52 | `74ed04e0e94d3ab63d2813d16d9a74a611c0979c62941a73d5f5d83112a71c15` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_grad_16_q0_m0_ff50nostrong_def.webp | 52 | `4fb13f8414e291bf5105ae21886f9c69f462ca8cc54da3eb2c5dfa9d20bdd20a` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_grad_16_q0_m0_ff50nostrong_segsegments2sns80.webp | 52 | `4ac23999f9a3e5922a312da98c2b3742d3d7f337933e9ba867a2b13564eec182` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_grad_16_q0_m0_ff50nostrong_segsegments4.webp | 52 | `4fb13f8414e291bf5105ae21886f9c69f462ca8cc54da3eb2c5dfa9d20bdd20a` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_grad_16_q0_m0_ff50strong_def.webp | 52 | `f66f9c308359adb73e01e8635ec1ca50c7dca4f61a3e59c8522759ff80d0623c` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_grad_16_q0_m0_ff50strong_segsegments2sns80.webp | 52 | `221d6b76d292045226ea10926b92d47cc35a39c381937a7ba101d6f252d87cb7` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_grad_16_q0_m0_ff50strong_segsegments4.webp | 52 | `f66f9c308359adb73e01e8635ec1ca50c7dca4f61a3e59c8522759ff80d0623c` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_grad_16_q0_m4_def_def.webp | 52 | `c491c180d5075406879f52329ba53fcad8366cd136acaad3bee7a686f7e299bb` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_grad_16_q0_m4_def_segsegments2sns80.webp | 52 | `492762bcbc505f8be81ab035b2f56132b8b9a3661b6d6a951858a947ec88651f` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_grad_16_q0_m4_def_segsegments4.webp | 52 | `c491c180d5075406879f52329ba53fcad8366cd136acaad3bee7a686f7e299bb` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_grad_16_q0_m4_ff0_def.webp | 52 | `992e9e6ab2c68c865c2003ef9c2c68e4adad1224d1fc8a537f3edfb4c3be0414` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_grad_16_q0_m4_ff0_segsegments2sns80.webp | 52 | `53b06a3f9bee096c5e130a281c778630e0c2c5c34422efc805bde958284bc870` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_grad_16_q0_m4_ff0_segsegments4.webp | 52 | `992e9e6ab2c68c865c2003ef9c2c68e4adad1224d1fc8a537f3edfb4c3be0414` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_grad_16_q0_m4_ff50nostrong_def.webp | 52 | `d0372cd4b38bc02c3517a07f3002daf56ad4f4865ead8a76b6ad303c7eaf5563` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_grad_16_q0_m4_ff50nostrong_segsegments2sns80.webp | 52 | `bf10d95059ea80267cdae53278ca7a67cc07eed5078e847a7c4c6897611b9a61` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_grad_16_q0_m4_ff50nostrong_segsegments4.webp | 52 | `d0372cd4b38bc02c3517a07f3002daf56ad4f4865ead8a76b6ad303c7eaf5563` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_grad_16_q0_m4_ff50strong_def.webp | 52 | `c491c180d5075406879f52329ba53fcad8366cd136acaad3bee7a686f7e299bb` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_grad_16_q0_m4_ff50strong_segsegments2sns80.webp | 52 | `492762bcbc505f8be81ab035b2f56132b8b9a3661b6d6a951858a947ec88651f` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_grad_16_q0_m4_ff50strong_segsegments4.webp | 52 | `c491c180d5075406879f52329ba53fcad8366cd136acaad3bee7a686f7e299bb` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_grad_16_q50_m0_def_def.webp | 100 | `be0d6e2e38365970b1c755c5adfffdcc4cae8f12f1e1c315193e6cc6816042ca` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_grad_16_q50_m0_def_segsegments2sns80.webp | 100 | `ca4f389468c00045ec1a609a5efa681ca1a781c86d8209d91cc2408874e170e8` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_grad_16_q50_m0_def_segsegments4.webp | 100 | `be0d6e2e38365970b1c755c5adfffdcc4cae8f12f1e1c315193e6cc6816042ca` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_grad_16_q50_m0_ff0_def.webp | 100 | `97b026b1b03dfdb9fee6c4e9ffcb9759e1b5116942cd3704c15feb2b2096acce` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_grad_16_q50_m0_ff0_segsegments2sns80.webp | 100 | `1aa7c9f668ffcd281f974f82e66e6beb7d2f9294774c47e2fbef686aefd6fd34` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_grad_16_q50_m0_ff0_segsegments4.webp | 100 | `97b026b1b03dfdb9fee6c4e9ffcb9759e1b5116942cd3704c15feb2b2096acce` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_grad_16_q50_m0_ff50nostrong_def.webp | 100 | `d3f1d1201e01ec0008362ee0fec56b612153c040f30ad1a54cc78d99b255329f` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_grad_16_q50_m0_ff50nostrong_segsegments2sns80.webp | 100 | `a7dc39171c96e83b9b89796eb46c5ed78c84324494bd4ec9e3d9a5125756cd73` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_grad_16_q50_m0_ff50nostrong_segsegments4.webp | 100 | `d3f1d1201e01ec0008362ee0fec56b612153c040f30ad1a54cc78d99b255329f` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_grad_16_q50_m0_ff50strong_def.webp | 100 | `fb429a46e481820ee677d846592d7cc0b5c4c9ae2ad1e564887229f8dacba341` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_grad_16_q50_m0_ff50strong_segsegments2sns80.webp | 100 | `0d1b948d9c010f6400cb590abf221af53967e2cc802608094c21f97fa31e6af8` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_grad_16_q50_m0_ff50strong_segsegments4.webp | 100 | `fb429a46e481820ee677d846592d7cc0b5c4c9ae2ad1e564887229f8dacba341` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_grad_16_q50_m4_def_def.webp | 72 | `bc34e054a0f4403e175d23eb7b8654836e5f3257c7d3b224829e232727e9571c` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_grad_16_q50_m4_def_segsegments2sns80.webp | 72 | `0abd011e116022a1c7db1721c4ecd1fd5511cbf11698a9f4b7c68280a26f762f` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_grad_16_q50_m4_def_segsegments4.webp | 72 | `bc34e054a0f4403e175d23eb7b8654836e5f3257c7d3b224829e232727e9571c` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_grad_16_q50_m4_ff0_def.webp | 72 | `fe89c13f2f3f997b00cb1f3d4ac2aae622c5e0b13f7cd2d7e9b7c7529e3adc6a` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_grad_16_q50_m4_ff0_segsegments2sns80.webp | 72 | `2e485355c5a913bd157cc4c3e75921d5ad8af5c09d494fb53215985c2b238f81` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_grad_16_q50_m4_ff0_segsegments4.webp | 72 | `fe89c13f2f3f997b00cb1f3d4ac2aae622c5e0b13f7cd2d7e9b7c7529e3adc6a` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_grad_16_q50_m4_ff50nostrong_def.webp | 72 | `ea33027612be5d17e56bff9fbc4e8ae264aaf16f9c4153c17ca0b0e5e8297961` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_grad_16_q50_m4_ff50nostrong_segsegments2sns80.webp | 72 | `1b4e333435eaf97ca8081ea00f3bbf02f763328e2e5a7d95404f17aa9b74a154` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_grad_16_q50_m4_ff50nostrong_segsegments4.webp | 72 | `ea33027612be5d17e56bff9fbc4e8ae264aaf16f9c4153c17ca0b0e5e8297961` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_grad_16_q50_m4_ff50strong_def.webp | 72 | `be5fc8c2dff7f6ee3bcec79e6a40125b68a01faa518ef3cd93343456cbd8c6e4` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_grad_16_q50_m4_ff50strong_segsegments2sns80.webp | 72 | `3cc0e27e0cb4684b80672b748f52cb2f3a4910580683e1b18f4c03f8f2b2b826` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_grad_16_q50_m4_ff50strong_segsegments4.webp | 72 | `be5fc8c2dff7f6ee3bcec79e6a40125b68a01faa518ef3cd93343456cbd8c6e4` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_grad_16_q90_m0_def_def.webp | 102 | `027bb35504fd5a0b7032037d2597a81239ed1e5fe004a01336006e8064203fcc` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_grad_16_q90_m0_def_segsegments2sns80.webp | 102 | `5124d2ca8efb0d5d119e6c123ecc183760fb9ef198e59b2e332a1f68cfd29926` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_grad_16_q90_m0_def_segsegments4.webp | 102 | `027bb35504fd5a0b7032037d2597a81239ed1e5fe004a01336006e8064203fcc` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_grad_16_q90_m0_ff0_def.webp | 102 | `451649345838839530ae55f67cee32b2e662c1f87def1381febf1a09ab08d725` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_grad_16_q90_m0_ff0_segsegments2sns80.webp | 102 | `1b9f843a47b1aa72f1b3e2c0a968ab42a4359a4aa0eda40f411491e757e031b3` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_grad_16_q90_m0_ff0_segsegments4.webp | 102 | `451649345838839530ae55f67cee32b2e662c1f87def1381febf1a09ab08d725` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_grad_16_q90_m0_ff50nostrong_def.webp | 102 | `1c265f90c8f9a43ece5b992e55c00903c54cb7b8fc4601098f909ce1bf15402e` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_grad_16_q90_m0_ff50nostrong_segsegments2sns80.webp | 102 | `b3e0ab6f2e262bb8caf121d8915344142265cf522fa0face4879e5a66bdbe9c9` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_grad_16_q90_m0_ff50nostrong_segsegments4.webp | 102 | `1c265f90c8f9a43ece5b992e55c00903c54cb7b8fc4601098f909ce1bf15402e` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_grad_16_q90_m0_ff50strong_def.webp | 102 | `ccd5ad4084eb396d6492ddb773b5410fbeba5d03164daa5251cc29e5a3b97c72` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_grad_16_q90_m0_ff50strong_segsegments2sns80.webp | 102 | `5fd68029e3ab8a20139e5c0a89a61f4027e9b3d733cf749e33bf5705a1775466` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_grad_16_q90_m0_ff50strong_segsegments4.webp | 102 | `ccd5ad4084eb396d6492ddb773b5410fbeba5d03164daa5251cc29e5a3b97c72` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_grad_16_q90_m4_def_def.webp | 100 | `19f5ba87c91a973402fc4377c5ec4e81aea7c395c87406cf4700194dbde4b454` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_grad_16_q90_m4_def_segsegments2sns80.webp | 100 | `d60ca6275b277b8abfd135d7eb46eab60df4cdae38ec70512d926cc28712c7e5` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_grad_16_q90_m4_def_segsegments4.webp | 100 | `19f5ba87c91a973402fc4377c5ec4e81aea7c395c87406cf4700194dbde4b454` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_grad_16_q90_m4_ff0_def.webp | 100 | `21f6b590cafe6a68cf731e7b0496973dcd110392ce32481508458dcfac349680` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_grad_16_q90_m4_ff0_segsegments2sns80.webp | 100 | `d275e4fff0dabec530011c4152f555528b273998562f0a882c9b33d175cef4e1` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_grad_16_q90_m4_ff0_segsegments4.webp | 100 | `21f6b590cafe6a68cf731e7b0496973dcd110392ce32481508458dcfac349680` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_grad_16_q90_m4_ff50nostrong_def.webp | 100 | `3d7ec2f058df29b9003dccd0574d7dd2c9503536330c2c4f2990d36aaee4bce9` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_grad_16_q90_m4_ff50nostrong_segsegments2sns80.webp | 100 | `cb0872a1cfa7303855d62030c6c005bea2fb58e63c4b15c8ab26c7d831dd854d` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_grad_16_q90_m4_ff50nostrong_segsegments4.webp | 100 | `3d7ec2f058df29b9003dccd0574d7dd2c9503536330c2c4f2990d36aaee4bce9` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_grad_16_q90_m4_ff50strong_def.webp | 100 | `32dedd24d315422921f1ca77091b0bc52e75992a722bb22e0a89daccf0e797b4` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_grad_16_q90_m4_ff50strong_segsegments2sns80.webp | 100 | `64080d9333962851a8d91ea7fb69c9c174c277c3e12575a4e6d56fdacc6711dd` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_grad_16_q90_m4_ff50strong_segsegments4.webp | 100 | `32dedd24d315422921f1ca77091b0bc52e75992a722bb22e0a89daccf0e797b4` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_noise_q0_m0_def_def.webp | 336 | `ad60285ec30b216c693c68b0082c31954760791654336946fdf457f860985e64` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_noise_q0_m0_def_segsegments2sns80.webp | 336 | `eed5bd6790c7c78941262d5175a155a8903bc4a55f055712fe21cf6f4ab68759` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_noise_q0_m0_def_segsegments4.webp | 336 | `ad60285ec30b216c693c68b0082c31954760791654336946fdf457f860985e64` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_noise_q0_m0_ff0_def.webp | 396 | `3f9b414c3a7ecc78d62e22893bb54335d9f7414f4e241cb05ac18efe0348b2fe` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_noise_q0_m0_ff0_segsegments2sns80.webp | 396 | `3cf4128b8cba5d60f97f3cde5c6c4c470b3ca64507ea5828abf17aa1073e39c9` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_noise_q0_m0_ff0_segsegments4.webp | 396 | `3f9b414c3a7ecc78d62e22893bb54335d9f7414f4e241cb05ac18efe0348b2fe` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_noise_q0_m0_ff50nostrong_def.webp | 336 | `7bb792cae9b0f3a620b7151459cb975edb38f19832b0d295f68ea1bf8ec6cc23` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_noise_q0_m0_ff50nostrong_segsegments2sns80.webp | 336 | `7181966745491b45b4c082cea8024e13411f5b0038f7fa3d958cd5945a99a1cb` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_noise_q0_m0_ff50nostrong_segsegments4.webp | 336 | `7bb792cae9b0f3a620b7151459cb975edb38f19832b0d295f68ea1bf8ec6cc23` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_noise_q0_m0_ff50strong_def.webp | 336 | `e9d4f581771d1733776cafd63fe9e81f3800e36987aafdaece55f907b60c011f` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_noise_q0_m0_ff50strong_segsegments2sns80.webp | 336 | `b5ee9221791b73955a34dd99587f92a1a704485713b8a01f876d72760d540a44` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_noise_q0_m0_ff50strong_segsegments4.webp | 336 | `e9d4f581771d1733776cafd63fe9e81f3800e36987aafdaece55f907b60c011f` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_noise_q0_m4_def_def.webp | 336 | `c5480cba6588b79e7546b8bffc8e7803c2d3dc1ea4dbcc59182fbd06376f5dff` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_noise_q0_m4_def_segsegments2sns80.webp | 344 | `c6dc32a38b48d39eef50f811b97f77c0d017b8cd3be66bf08f851cded4a06c13` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_noise_q0_m4_def_segsegments4.webp | 336 | `c5480cba6588b79e7546b8bffc8e7803c2d3dc1ea4dbcc59182fbd06376f5dff` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_noise_q0_m4_ff0_def.webp | 336 | `70af5559c4692a169035caf4f00a11efa1e7cd7b97d8c67fd23b513410f4739b` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_noise_q0_m4_ff0_segsegments2sns80.webp | 344 | `fa7be6f61d5498c5e26e1eede841a1fb3b0921b16d340078030e9b26f7e1826f` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_noise_q0_m4_ff0_segsegments4.webp | 336 | `70af5559c4692a169035caf4f00a11efa1e7cd7b97d8c67fd23b513410f4739b` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_noise_q0_m4_ff50nostrong_def.webp | 336 | `ad02ac7fee7d0b829f7dd27aa51228447b49c1058e1e85f096561ba09c8b4ea7` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_noise_q0_m4_ff50nostrong_segsegments2sns80.webp | 344 | `ef5f6a2a9f62ce5d21d969458c1752b3ac75c3ea6702abb9154e912b7df6ee17` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_noise_q0_m4_ff50nostrong_segsegments4.webp | 336 | `ad02ac7fee7d0b829f7dd27aa51228447b49c1058e1e85f096561ba09c8b4ea7` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_noise_q0_m4_ff50strong_def.webp | 336 | `85ebbca7a5c1fa9027d06140789271cafc8eb23d6f86079cf2cd92e9aab13ffd` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_noise_q0_m4_ff50strong_segsegments2sns80.webp | 344 | `c13d99e7550e1e49f28167dbd16c8c400d4fad5594b27cdfd9057c4e6fd74c30` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_noise_q0_m4_ff50strong_segsegments4.webp | 336 | `85ebbca7a5c1fa9027d06140789271cafc8eb23d6f86079cf2cd92e9aab13ffd` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_noise_q50_m0_def_def.webp | 1854 | `cdf1d78733674212f2cc21384f7975a7df02979db17970c6203300e06ec0ed7c` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_noise_q50_m0_def_segsegments2sns80.webp | 1854 | `de97cf3270443fa109d9f8bd2aa7834aa3f43152cbe300967015752fe2a04145` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_noise_q50_m0_def_segsegments4.webp | 1854 | `cdf1d78733674212f2cc21384f7975a7df02979db17970c6203300e06ec0ed7c` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_noise_q50_m0_ff0_def.webp | 1850 | `211656e102bff20d4af85d10378cab4a1c6ffba8510301c4c3b722b999ea4293` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_noise_q50_m0_ff0_segsegments2sns80.webp | 1850 | `1b139026f5b7fbedb09cc9ec322f538c089d39f78356365d8e91a1122ecabeec` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_noise_q50_m0_ff0_segsegments4.webp | 1850 | `211656e102bff20d4af85d10378cab4a1c6ffba8510301c4c3b722b999ea4293` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_noise_q50_m0_ff50nostrong_def.webp | 1854 | `7cc7210491c3510c23ec275385a5b304d180245c872c034a405aaff95c47a998` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_noise_q50_m0_ff50nostrong_segsegments2sns80.webp | 1854 | `d6a142a372a48049d4f03b1f480d3d960966ca74620ebafd0a49bbbc901a5bb5` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_noise_q50_m0_ff50nostrong_segsegments4.webp | 1854 | `7cc7210491c3510c23ec275385a5b304d180245c872c034a405aaff95c47a998` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_noise_q50_m0_ff50strong_def.webp | 1854 | `115e33a4ce8bab001fd6e6f4f4e7d039787ba7c93d9b9707f4fef61b09000bf7` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_noise_q50_m0_ff50strong_segsegments2sns80.webp | 1854 | `fc3f9ebc16eeb23c17a69cd507653c82a2eb9646c594eb8882ff1e48ac1b7985` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_noise_q50_m0_ff50strong_segsegments4.webp | 1854 | `115e33a4ce8bab001fd6e6f4f4e7d039787ba7c93d9b9707f4fef61b09000bf7` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_noise_q50_m4_def_def.webp | 1838 | `580aa22cc7b5d49252582fb429e288f92715c78d21b00d0c4331d1c62271dfe6` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_noise_q50_m4_def_segsegments2sns80.webp | 1836 | `083225f7c0f17b31970c8dffd9ac100eee35a36e0d7bb8a9ed9970660e66fbd0` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_noise_q50_m4_def_segsegments4.webp | 1838 | `580aa22cc7b5d49252582fb429e288f92715c78d21b00d0c4331d1c62271dfe6` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_noise_q50_m4_ff0_def.webp | 1838 | `9e72211ce1bb202d5a9d054c29705b5686a2cc4fccdaaec110b95bc315249dac` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_noise_q50_m4_ff0_segsegments2sns80.webp | 1836 | `7eb04136b945ffc111a48f38653e29ddac97d570dd9ae13d5ea610e418974bc2` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_noise_q50_m4_ff0_segsegments4.webp | 1838 | `9e72211ce1bb202d5a9d054c29705b5686a2cc4fccdaaec110b95bc315249dac` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_noise_q50_m4_ff50nostrong_def.webp | 1838 | `2fc5e0fe91cd4f81569de5db80e73356710862ad5f9f1cda667f343ad8fd12aa` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_noise_q50_m4_ff50nostrong_segsegments2sns80.webp | 1836 | `ee48a9d301b3332914a9a6f1f5d42186219187f5d71968a9ec4a09612064c374` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_noise_q50_m4_ff50nostrong_segsegments4.webp | 1838 | `2fc5e0fe91cd4f81569de5db80e73356710862ad5f9f1cda667f343ad8fd12aa` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_noise_q50_m4_ff50strong_def.webp | 1838 | `90ed258458bc3ad9a8112207023505c0bb3afaaefd40b3ec09088bd8dda95b40` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_noise_q50_m4_ff50strong_segsegments2sns80.webp | 1836 | `64e72145c768dcca26d830e677765bf90372f63889206d714ae147fc1e1cdc65` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_noise_q50_m4_ff50strong_segsegments4.webp | 1838 | `90ed258458bc3ad9a8112207023505c0bb3afaaefd40b3ec09088bd8dda95b40` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_noise_q90_m0_def_def.webp | 2870 | `908ff9dda0b45664d3c4425d8d541cf0214a30c57df4cd02d1b020ff27a9d8a7` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_noise_q90_m0_def_segsegments2sns80.webp | 2870 | `b991586b70e526998a2bca1e5f7792bcd39c6b5d7d59c55d12f2fd60d967c0fe` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_noise_q90_m0_def_segsegments4.webp | 2870 | `908ff9dda0b45664d3c4425d8d541cf0214a30c57df4cd02d1b020ff27a9d8a7` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_noise_q90_m0_ff0_def.webp | 2868 | `66a22a25115d26c20febbe27477453175203c05c65697ba40eddd45b44f6f51a` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_noise_q90_m0_ff0_segsegments2sns80.webp | 2868 | `b1973dffe5a1f160a0eda6fe538d4d991c62268c376c4b173b97374edd7243d6` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_noise_q90_m0_ff0_segsegments4.webp | 2868 | `66a22a25115d26c20febbe27477453175203c05c65697ba40eddd45b44f6f51a` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_noise_q90_m0_ff50nostrong_def.webp | 2870 | `b5f6547f8db5d9ee9ee98bf01f8e79b9b7614f52798e6166f5dfb4b1f6f61c9b` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_noise_q90_m0_ff50nostrong_segsegments2sns80.webp | 2870 | `3898c7562a5e642355149ca9d1ece3973b1e0ec312b2de48011655794951bd8f` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_noise_q90_m0_ff50nostrong_segsegments4.webp | 2870 | `b5f6547f8db5d9ee9ee98bf01f8e79b9b7614f52798e6166f5dfb4b1f6f61c9b` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_noise_q90_m0_ff50strong_def.webp | 2870 | `656eeb716dd8ef21c9338d153416360fd36734b4beeb27a5cbd01a18278a8ff5` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_noise_q90_m0_ff50strong_segsegments2sns80.webp | 2870 | `34e024165007a3d0e58f45a4dea3be9f9e8fec1a5484ed8962e94f703c1028d1` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_noise_q90_m0_ff50strong_segsegments4.webp | 2870 | `656eeb716dd8ef21c9338d153416360fd36734b4beeb27a5cbd01a18278a8ff5` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_noise_q90_m4_def_def.webp | 2856 | `2b18e5766478645fc6787175d38d105720f166721f14ae4abb63b2b54290864e` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_noise_q90_m4_def_segsegments2sns80.webp | 2862 | `1b2c451f1a21c212f58041cd1b87e0dfcec3a4513540d98f2873bd36b4b68e33` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_noise_q90_m4_def_segsegments4.webp | 2856 | `2b18e5766478645fc6787175d38d105720f166721f14ae4abb63b2b54290864e` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_noise_q90_m4_ff0_def.webp | 2856 | `1442c5cd892695f479c3526b82d837bdf3f97aa8b87744a612dd482448cc671c` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_noise_q90_m4_ff0_segsegments2sns80.webp | 2862 | `304d17b27a2274656e42a63e2cbed9ffe477553aa1a4c43ee5feaf6e7c210a89` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_noise_q90_m4_ff0_segsegments4.webp | 2856 | `1442c5cd892695f479c3526b82d837bdf3f97aa8b87744a612dd482448cc671c` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_noise_q90_m4_ff50nostrong_def.webp | 2856 | `9814a5891527ee2223ca978f8de922609b6ccf41856551e86ff32285b4d1faf6` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_noise_q90_m4_ff50nostrong_segsegments2sns80.webp | 2862 | `4f18100a21a4fe483330a208a82d415959f4c99923bc5a6688feec73a02a4823` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_noise_q90_m4_ff50nostrong_segsegments4.webp | 2856 | `9814a5891527ee2223ca978f8de922609b6ccf41856551e86ff32285b4d1faf6` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_noise_q90_m4_ff50strong_def.webp | 2856 | `f4e910f1e90a5072412fa8a290f8f4369ee57574b5e1a3fb55b18e1fbb51a335` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_noise_q90_m4_ff50strong_segsegments2sns80.webp | 2862 | `749420b2fef1d0873e13f21e6e789f81f12995f241b3c85439348e287827e1dd` | webp | unknown |
| imazen-codec-corpus/webp-conformance/valid/src_noise_q90_m4_ff50strong_segsegments4.webp | 2856 | `f4e910f1e90a5072412fa8a290f8f4369ee57574b5e1a3fb55b18e1fbb51a335` | webp | unknown |
| imazen-codec-corpus/tiff-conformance/edge-cases/geo-5b.tif | 1418 | `996778b080785112f64e62db9eb2766ee1e2185ba7a07b4df27aef21ee5a694e` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/edge-cases/subsubifds.tif | 4774 | `145292ca9f6df9c4a9a41381efccefc76e8fa7392e62118bbb6fc982c3d02168` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/edge-cases/test_two_ifds.tif | 312 | `e8167ea8ec1d9e145798ac7fc19a3fd79c6eee55ed0923b17a305f4fca0d6810` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/edge-cases/tiff_with_subifd_chain.tif | 19484 | `e50130294baf254b8ab54a46b96e8d8d13abe840e4d8a447086028375de97c37` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/edge-cases/usda_naip_256_webp_z3.tif | 20532 | `5f64da128a9c82fbf7f6519400102ed5925fd911bb7f002535c15ef872b618d6` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/robustness/sample-get-lzw-stuck.tiff | 7048 | `ea353a95780cd5b2550e9e837d5c414366fe8ff6aaaebfb22d3e40f8a8eaf805` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/robustness/test_ifd_loop_subifd.tif | 1654 | `9f7b0b1ef6fe925f2b4913e2e108ecfb1f9547346de17e53c61068888b7345aa` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/robustness/test_ifd_loop_to_first.tif | 312 | `516a304cc30116b6f3a123544ad287d7fbe93aae1bf741a883b1d0b92f7dec9d` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/robustness/test_ifd_loop_to_self.tif | 558 | `38b3093d53a1a80fdb949992ee51d6cb184894cc82ddec7a7f71ea5817e49868` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/12bit.cropped.rgb.tiff | 18748 | `ed26c4dc0295e10b995489060c829bd32011eb467cbb4ac6e02645b73e9f327e` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/12bit.cropped.tiff | 6366 | `07d2772d758c15a8f04db272b436a658ed9009c30afca9f56ac2c7ce5be6bc01` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/32bpp-None-jpeg.tiff | 4704 | `21219d01c2a1893514387d2c69cee50a0046d492554959ff23b767a011568e0b` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/32bpp-None.tiff | 13222 | `a5f33714dd02a78aec1aeeacfd6c4fbaca23b1d373c0a077f86da971d7789504` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/BigTIFF.tif | 12480 | `ddb202145a9bce7670cc372ee578de5a53cd52cc8d5ae8a9ebdc9f9c4f4a7e81` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/BigTIFFLong.tif | 12480 | `90178643a159ec50335e9314836df924233debeb100763af0f77cd1be3cf58ab` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/BigTIFFMotorola.tif | 12480 | `ace8a27dbed9f918993615e545a12310b84ad94bc6af8e256258e69731f1c7ce` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/Transparency-lzw.tif | 6158 | `b15297094106a33374672a6971ed1aaa5d2fbf3f3731c61af1107ba3e88af156` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/big_g4.tif | 8338 | `b695147c090154c3d93c8fb60eb84a2624cfc18a1dbe99e7ddc93a4d3f579de2` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/caspian.tif | 298292 | `8d24d6e871994785469a8609d3730213ffdc86108b467e241cbc8175e4346319` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/cmyk-3c-16b.tiff | 189934 | `e2a03a33461979683adceb116cd0e021e7485a29c12b9923763babe5d4b1b25d` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/cmyk-3c-32b-float.tiff | 6754 | `9c5c03df6a29da9d139a05f9c2be897b10ff4ac964420b0089421788736cf676` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/cmyk-3c-8b.tiff | 95106 | `95da78b7f2d254710744daeb29405a160c7e8e7f45312ca217c6564065bee082` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/cmyk-4c-8b.tiff | 130178 | `e43117f88d97b0919c6537cf1680c3432f1c99d2396eaecb9435f677ebde2f87` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/cramps-tile.tif | 786758 | `cd14f8e22fc486f501fd4cdc9d9911e3582f7ac46972e71d4942c73e16ba3d7a` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/cramps.tif | 194176 | `d9fb9600d745cb33a82a5448ef6cf9d6933c9462b90d3887475039ae2485af40` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/custom_dir_EXIF_GPS.tiff | 2504 | `70bbe67a6d1db0e562690505578ef798f61969b8c609c8886bd8545b4f9c1126` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/deflate-last-strip-extra-data.tiff | 12789 | `031aa7e15c2dfb21fe2fdd89eff88c4505c306f641be8b98f3666707d698b5ae` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/dscf0013.tif | 654030 | `534ef0986c7a39e33b117fe67c0d3f8b7509ceaa248e31b447360b6e4a36a7c9` | tiff | FUJIFILM |
| imazen-codec-corpus/tiff-conformance/valid/extra_bits_gray_8b.tiff | 338 | `eefb0f8c7191f157a9a0548eef8b935aab2b3be5465fcff38b4fcba3730e00cf` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/extra_bits_rgb_8b.tiff | 482 | `f669a0a9243c0a622a5b50e802c5ed592b11001cd6bb12c01f84905eaeac481a` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/fax2d.tif | 32817 | `4e497620740a6c192ac9523817c9e51ba3596d5ab8b4ac1a15e8cc58e9a49b3f` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/fax4.tiff | 33630 | `ddfcee5324f5b69cc1145276b4aa698fa08ede0b076aa0d183fe0761265ba503` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/flower-minisblack-02.tif | 1131 | `3122afede012fa00b8cb379b2f9125a34a38188c3346ec5e18d3b4bddcbb451b` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/flower-minisblack-04.tif | 1905 | `18991fca75a89b3d15c7f93dee0454e3943920b595ba16145ebc1fd8bd45b1f5` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/flower-minisblack-06.tif | 2679 | `b0c13012d8d35215b01192eb38058db4543486c60b4918beec8719a94d1e208e` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/flower-minisblack-08.tif | 3453 | `1268d843a2338409ec3a9f5a5a62e23d38c3a898035619994a02f21eff7590bf` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/flower-minisblack-10.tif | 4269 | `a91d6946730604dd65c63f1653fb33031682f26218de33ebf3d0b362cb6883af` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/flower-minisblack-12.tif | 5043 | `86fc9309872f4e4668350b95fae315d878ec9658046d738050a2743f5fa44446` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/flower-minisblack-14.tif | 5817 | `dcd07668c73f24c2a13133ac4910b59a568502a6d3762675eef61a7e3b090165` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/flower-minisblack-16.tif | 6591 | `79531a10710dee89b86e2467818b7c03a24ff28ebd98c7bdcc292559671e1887` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/flower-minisblack-24.tif | 9770 | `fe2d4e0d99bdfade966e27bd9583bce39bebb90efa8e7f768ce3cec69aa306e2` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/flower-minisblack-32.tif | 12885 | `6677c372a449fe0324b148385cf0ebaaf33ab4563484ae89831dfeacd80d7c93` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/flower-palette-02.tif | 1164 | `75e74d8816942ff6e9dfda411f9171f0f1dd1a5a88cb1410238b55a2b2aeeb71` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/flower-palette-04.tif | 2010 | `700ec8103b4197c415ba90d983a7d5f471f155fd5b1c952d86ee9becba898a1a` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/flower-palette-08.tif | 4998 | `1a05a3e39e3f58e48e3667e8cca3613476752e2defe0af80c07faf2bb00d7812` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/flower-palette-16.tif | 399816 | `fc107b301c04288133f990dc7c87a01cf9bed2a1c7097ea6c162c879b581011d` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/flower-rgb-contig-02.tif | 2685 | `fbcd225c0db343f0cc984c35609b81f6413ebc1ba2ce2494d3607db375e969ff` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/flower-rgb-contig-04.tif | 5049 | `96c4c1dfc23a0d9e5c6189717647fa117b08aac9a40c63e3945d3e674df4c3c6` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/flower-rgb-contig-08.tif | 9753 | `dd1333eb93d8e7ea614b755ca1c8909c67b4b44fc03a8cab6be5491bf4d15841` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/flower-rgb-contig-10.tif | 12117 | `68168ea1c2e50e674a7c5c41e5b055c881adf8cb940d0fd033a927a7ebdd7b6f` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/flower-rgb-contig-12.tif | 14483 | `5f7a63eb8636e2b1ee39dfda4d0bddfc98bdc9eb94bea2dd657619331fa38b5b` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/flower-rgb-contig-14.tif | 16855 | `a419a8e2f89321501ca8ad70d2a19d37a7bf3a8c2f45c809acc30be59139ae29` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/flower-rgb-contig-16.tif | 19177 | `ab3d6b619a198ff2e5fdd8f9752bf43c5b03a782625b1f0e3f2cfe0f20c4b24a` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/flower-rgb-contig-24.tif | 28632 | `bbb2b4ca6d7eeee4737c6963c99ef68fb6971cf6ccee463427a8246574bc6440` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/flower-rgb-contig-32.tif | 38027 | `d7b9da8ec44da84fc89aed1ad221a5eb130a1f233a1ff8a4a15b41898a0e364f` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/flower-rgb-planar-02.tif | 2795 | `21c4ede6382d8c72cb8e6f7939203d5111b362646a9727d95a2f63310ec8e5b3` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/flower-rgb-planar-04.tif | 5117 | `ca4434aa1a8c52654b20596c7c428c9016e089de75c29dc6ddcd32708874005c` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/flower-rgb-planar-08.tif | 9761 | `9fec3afeaee2a1fa931e2321f266d0c546ef3437aba343d3065bf4ea8bf1d0fa` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/flower-rgb-planar-10.tif | 12211 | `7f53948d4a36c80f45d70a315d2e76514ec41cabe982c06dbbd0d47e671120e2` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/flower-rgb-planar-12.tif | 14533 | `e1ea49266f135789aee22eb6485e6d72d88a4cd3998343a712fa702d1ea76ff8` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/flower-rgb-planar-14.tif | 16855 | `d28f021d40f53a011053f9644400fee2d29c02f97b4101fec899251125dbb18e` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/flower-rgb-planar-16.tif | 19177 | `0a143fb6c5792fa7755e06feb757c745ad68944336985dc5be8a0c37247fe36d` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/flower-rgb-planar-24.tif | 28648 | `ccce34f6c962b708b1147511e755bf878765d7f5e5c048cf6517195349d7c119` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/flower-rgb-planar-32.tif | 38035 | `a718ae37d6d7a5bb5702cc75350f6feec3e9cdcd7e22aaa4753c7fe9c2db9aae` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/flower-separated-contig-08.tif | 12911 | `3f4deaa5293773feb5cdf41f5f625e5fa1399c9881af8d033897c30e46811419` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/flower-separated-contig-16.tif | 25483 | `6dc012a88f3ba41d6326c5211543e21f21e6f5d1faaea4c59018da93317d9462` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/flower-separated-planar-08.tif | 12927 | `6f6e99290839dc804a49fbadd224b842a66581ddff63461413c3d80c319d8468` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/flower-separated-planar-16.tif | 25483 | `07bd74b686dfa4293d0047ec80bcd4c08159d669ff70dd33914edb0d050da850` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/g3test.tif | 50401 | `d5b2e1a17338133aa95cb8a16d82a171f5b50f7b9ae1a51ab06227dc3daa81d5` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/gradient-1c-32b-float.tiff | 1357 | `19d5561fa1e80ce85e2d1d71b194abc19b9bc0d13baa4b1e76f30298d1243fef` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/gradient-1c-32b.tiff | 1341 | `534fe9778ab696c56526fd214e8a054ca8a84f2d5c047732a6d7ccbcff5a2afe` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/gradient-1c-64b-float.tiff | 2368 | `1b1083f46b9eeafccab4e34721b4deb1e75cef30a5572354babbf3811cc655c9` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/gradient-1c-64b.tiff | 2368 | `42b9bbd3e337ef25ccb67015d0a8b27683927f83e18d613a421bd0363e612f71` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/gradient-3c-32b-float.tiff | 3477 | `ab0860fac93fc2d4a83ed78b5c3ab7ecbb030aa47b87601ecbfd9f1e8148824f` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/gradient-3c-32b.tiff | 3401 | `35d062b32ee5ca3f5daeeecb568b634eb4b01e7110e1beee8afdb1bd23e0bf13` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/gradient-3c-64b.tiff | 6480 | `a82c02e85578344c318c78644374dca4fafa2985902105372ac5855a63590e85` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/hpredict.tiff | 2163 | `7c43bde225d30f1f435238469ee2bd01d17e2205bba92fd5af91fa4b57321fad` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/hpredict_cmyk.tiff | 2668 | `f28f444f89bd0f2e89482eac5e2eff11b5f7638f70d7fe69722043a9658300d9` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/hpredict_packbits.tiff | 4094 | `6996306b956e6068dba56f5b66712c302145fddbe39585e000a2bf72d7749b04` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/imagemagick_group4.tiff | 1216 | `71f7895a038857e11a751f792e9dafb7a75d2c1f3c05a9c5994640104ac0e0dc` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/int16.tif | 8512 | `134d1e30e577d360d7ac321d58f9dca60e2c0ce006aa919c126533decceebb5c` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/int16_rgb.tif | 24912 | `63bf3ce9829816213447eb17a3b459914978f3a5bdec5fe75a30db8ebef4a55d` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/int16_zstd.tif | 7835 | `7eb1cab565d023001237b88b0550c730311d6321d4f03fe0a725fc49576146c5` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/int8.tif | 4416 | `5fd7b83f7ffa733eeac86aee3bd2aacf2c5b3f5e6df8bcff20cfec2ca23e81ca` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/int8_rgb.tif | 12624 | `08d97c0afa79f19e6890e5df1a1ba0f8cfed654e2d45ed68a7e6fff7a8582a0d` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/issue_69_lzw.tiff | 2941 | `fb60702c13090053a7692b3eae3db6b6f4b78aa2003ecb83598acdb24e46e72b` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/issue_69_packbits.tiff | 4427 | `377182ba4be5db17b16afad020586e2f088557cfff05bdf3de26ad0c8d7b788f` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/jello.tif | 47136 | `4ded66cd13d87a36b7d33e663e3bfed7c2a150419579fd6491d09cd437f18edc` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/jim___ah.tif | 67677 | `f86a709bb0c14bac7a754099e2e1b669b23fe992ce87102e60c4092ae3d6610d` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/jim___cg.tif | 94101 | `60c35acf9427754276c5cd201cec609a4401f8f6bc44202e91f3307c3d16f738` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/jim___dg.tif | 94089 | `c66cf8b3d3592b1a424669c3164b93476bc5cfef8ebaf03a938c7e672564d614` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/jim___gg.tif | 94101 | `aab4c8590e9f879d9857df58707c780a7091214f75c1620d1ccf671d11c2febc` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/kodim02-lzw.tif | 726638 | `9a9e3cf1c53e13a38f9d6409b0aae3fe214fea1b004ac3e848766b08bde38f66` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/kodim07-lzw.tif | 643034 | `068beb46a3d186ed2fa65d5afbdbf1b34a02287b8d6c9e9c858728295ab277eb` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/l1.tiff | 1558 | `3c1f5759931eb0041f6146a69edab51349759d6cd204f2ce187dd15d06ea26ad` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/l1_xmp.tiff | 4430 | `6e2bb45be2ec884b2cb88133e98e7cb434281b6722d77fd4e9ce1b5da10166a0` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/ladoga.tif | 20420 | `16b185b70346d6b88d3a92010bc27018a1a2377ce3c99c9968a1c0c4eba8ec98` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/logluv-3c-16b.tiff | 166 | `a042e969b1f6ee47703e5187bdac782510023906cd99fdb81ad41e510f4c457d` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/lzw-single-strip.tiff | 76264 | `9cbff8fbe7a487da5d56e7e7566c0f3984e7092a3b1ccfe6bc1461449d008e4e` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/mandrill.tiff | 786572 | `3f590b52279fb59b81906f1e928ae713a5357b1afc1a2017a103adb563fb4494` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/minisblack-1c-16b.tiff | 47733 | `4b158802cb0926445ca0e61a43e9aad16290c63950457466992d53f3e2843a02` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/minisblack-1c-8b.tiff | 24001 | `7993664077ea8898704d15128e563d9ddd9c85376b3e8b42b0865a2ba71ee175` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/minisblack-1c-i16b.tiff | 47709 | `de6cebc2b557ab61a372882372c465dacfe7905d63685aeed9b059756f507301` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/minisblack-1c-i8b.tiff | 23982 | `0fb426d2b2c7cfca8c8c8e96dee474df9edf8b0a35ed42d22464177e525776d4` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/minisblack-2c-8b-alpha.tiff | 4068 | `6fcb5238fb9bd583cd78b27c51b16492d17d4768032f9ee1ed10f2d2f45730c9` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/miniswhite-1c-1b.tiff | 3289 | `9b303ec8e0dc83e9099af6a8c0d837772caad953d72995ad34e2f842fb66e83f` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/no_rows_per_strip.tiff | 786572 | `3f590b52279fb59b81906f1e928ae713a5357b1afc1a2017a103adb563fb4494` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/off_l16.tif | 72236 | `db3aef0764247a6b31fdb3eae095bbe2333c1b184e139ca52f9105711104c8c6` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/off_luv24.tif | 225250 | `35fcaf859368f30b1abd76941d7a670eb47eb71de2ae9a5d9af1dddb9e780e6b` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/off_luv32.tif | 115150 | `9ffc561bbbd27969715d9f52e7c5cfbeba0d37c6542f0a350de881b0ea6dac63` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/ojpeg_chewey_subsamp21_multi_strip.tiff | 39752 | `fa829625035ed42a71d3baf0c4148903808b7c16c5e3a5a97a86909a969a57cb` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/ojpeg_single_strip_no_rowsperstrip.tiff | 8258 | `bb4e0c9436da88030de5bb4f1042326fb15593d81650cfb6c51be800059ca032` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/ojpeg_zackthecat_subsamp22_single_strip.tiff | 8258 | `0d31f2acb25bfbde4d79975572369c3e4bea8e978fc1935075a545e3f8321b6e` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/oxford.tif | 21170 | `951b0ad3ea200bac4aac94c288b2f76051b7d1ee4c4fa468909ad3110fe97a8d` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/palette-1c-1b.tiff | 3312 | `a5793c7369c07eda42c81b492661ec15511b7082df7b4eb728130ac6baec4fe4` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/palette-1c-4b.tiff | 12322 | `148fc93d0effb9287aa93552efabe913a6c60093940a129d9c96b48ebe6a933f` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/palette-1c-8b.tiff | 25548 | `9ef8051e9aa19f7439fdec77c7e5bdffef442572937287a83b5938bd02464286` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/pc260001.tif | 936524 | `5f54cae906e90f7b3e6b58ff181dc30c911e74eed3548b35ff5c3c2dcc6249ba` | tiff | OLYMPUS IMAGING CORP. |
| imazen-codec-corpus/tiff-conformance/valid/planar-rgb-u8.tif | 518542 | `9dbb14b36318177a412d118dc5b25c96da2eef3eef09749e3eabf734479f6642` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/predictor-3-gray-f32.tif | 103092 | `2233f466fe423e4c5db88343b3b12a81ec254433e380f10a487fbec8f10b82a6` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/predictor-3-rgb-f32.tif | 10294 | `e0eeb31d656b773ae9877cd870b9c53ce507a88e3023513e0f1a5db9679e3c50` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/quad-jpeg.tif | 24428 | `61f858392d372b9af0200901ab147d1103bc3e2c811df9ea7ea8dfe2d1d47b06` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/quad-lzw-compat.tiff | 214342 | `081118d951224d9909b105bb75f9667fd817e7b95122d141e91b43604dacd78b` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/quad-lzw.tif | 214342 | `081118d951224d9909b105bb75f9667fd817e7b95122d141e91b43604dacd78b` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/quad-tile.jpg.tiff | 27576 | `657062ada721390508c93606e2d7a33295722a171be65f55aa578f4aeeb96db4` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/quad-tile.tif | 209220 | `ab5e5c87cd575472c6fc3e0d5824ebc818b88bf6e5e4aff3afe66f8725351a09` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/random-fp16-pred2.tiff | 683 | `54c32d5e678fb1cfbf3d2c0f6809942eecdc58ccb621af8c4950368269b1eee8` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/random-fp16-pred3.tiff | 698 | `eb46ea0d35eceea03215404b9b4cb90885d1187ca32cf3fee29545aaac14fd1f` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/random-fp16.tiff | 621 | `aca02193beb4c39a8ee3e6e9c07f9a15b9651b225373ce1260cd8d86e4622820` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/rgb-3c-16b.tiff | 142670 | `31ff3a1f416cb7281acfbcbb4b56ee8bb94e9f91489602ff2806e5a49abc03c0` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/rgb-3c-8b.tiff | 71470 | `21a751d4d6cad3903e4833db726c1b645fc88a1161efffcabaf9ce9c8c8f7084` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/rgb32f_bw.tiff | 12537 | `8c048ac59deeb48fd2c9bdb88a403168888e6a87b116bf28ff2e9c57c1ec456e` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/rgb32f_color.tiff | 12540 | `0831ed869c2f1bd6b4da7d61e3105319575329e22723896483f7a7a2ea626917` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/single-black-fp16.tiff | 457 | `59b5c0d44ee5a0859dd7ca6af1207c45f06cfb13fc937239975d662a1b1d2dc1` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/smallliz.tif | 5052 | `e8f722bc322b9a7621d1d858bec36ea78d31b85221f314a2b9872d3af91d600a` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/strike.tif | 110644 | `51053dfe72963c9d9e3b1918c271503dc2f77af80535ce36589bc1a1819c96a0` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/test_float64_predictor2_be_lzw.tif | 872 | `92b52def55d4fad284fe74b447b1a4a008c4ae0c2eeb80044e18b8f5a192f670` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/test_float64_predictor2_le_lzw.tif | 887 | `0aa2ac5e2513e9a9f76ac70eaab47002f255ddd3648c4335b30a1fdd337ed821` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/testfax3_bug54_1dnoEOL.tif | 39616 | `a0617b2e2307e2f1abf567bc97e9dc48e7a2dd2ddfacd14cba81205d884f6743` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/testfax3_bug_513.tiff | 198 | `2f8639e9a1e9fc5c4561541c15dcb59f77a710b1e06aede23ed5ed6ca5580ceb` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/text.tif | 154496 | `0b9c03248c2e1d4acaf1437e9b16326a1e0da46342c56f38a4a1b62a51d448d7` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/tiled-cmyk-i8.tif | 566270 | `d462461f4f04d10606e682fca160e64a8fce48b848c1fe03845b7f6f687e2133` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/tiled-gray-i1.tif | 614 | `87146dc6f68dc847935e058f7b2887008efba8d43cdccda8246198a3fb7fb351` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/tiled-jpeg-rgb-u8.tif | 99730 | `de19636058197e6dbf1eb7ebe14483d34afd43b5c70cf260ab820fb0c375ade5` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/tiled-jpeg-ycbcr.tif | 37575 | `c9af302b0d464a77b0cafb7518e828246fd7c00f266fa1e3dafde5b9be06a7e4` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/tiled-oversize-gray-i8.tif | 115390 | `c531a26e5c25938cc2dadfd0ad1a5d1b346c207d5dc0a79c77283dc12f859d7a` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/tiled-rect-rgb-u8.tif | 590440 | `b81da09605d08f9b9d78dd84ae8710115373314c396582596b2141aa9924550b` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/tiled-rgb-u8.tif | 416408 | `a9df18b839a77bea23d54a36945a2b0a037e5bbbe5a1cad8a977ccfbe05e1123` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/webp_lossless_rgba_alpha_fully_opaque.tif | 738 | `ca79569f94dad826998157d1415dadc4ea2930d79e772f8e0be79e09c3984b97` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/white-fp16-pred2.tiff | 1311 | `d08b81a495f01ead79877eba71c05ea476cfcfb0bd1285a7d0198ade37fa50ed` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/white-fp16-pred3.tiff | 1359 | `13a2d065b2b003263744730ed21a0e160c01ca34e4702580bd282427abaf63f4` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/white-fp16.tiff | 131351 | `1f40d3266bbb5f57ff461f175ed7d39e22b145efda14d609c4f663469a8dbf74` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/ycbcr-cat.tif | 72766 | `264d4955898a35ae70af0ec6eed0dbc49d7929f6c18c92a4ed6198f6db396f4b` | tiff | unknown |
| imazen-codec-corpus/tiff-conformance/valid/zackthecat.tif | 8258 | `0d31f2acb25bfbde4d79975572369c3e4bea8e978fc1935075a545e3f8321b6e` | tiff | unknown |
| imazen-codec-corpus/pngsuite/PngSuite.png | 2262 | `6cf3bcd1757bfad2a7ce9c9659d4f609297a0828cafc7c9eddee18c5576ba9e9` | png | unknown |
| imazen-codec-corpus/pngsuite/basi0g01.png | 217 | `9bf1c4610280efecc291361e2b7b026d602d03a7137f476ff84af626bb7b3a62` | png | unknown |
| imazen-codec-corpus/pngsuite/basi0g02.png | 154 | `50ed4ff9c1c80578ae58ead6fb28ea2e44016b5b56a7b3e95c235ec86f97c0d8` | png | unknown |
| imazen-codec-corpus/pngsuite/basi0g04.png | 247 | `0cce4212157dae7c0f71f5f72cef39cecab3347de455da0ace7de83eebd47849` | png | unknown |
| imazen-codec-corpus/pngsuite/basi0g08.png | 254 | `b9300750e7414c9fed68cc7f4f531f5e2cdd2724f50142e8aa3a0070836bece9` | png | unknown |
| imazen-codec-corpus/pngsuite/basi0g16.png | 299 | `d354026bdd0aa6ed7bedea7c92e5eef2ebbd4854848b8a0a48f562cc71bfe80f` | png | unknown |
| imazen-codec-corpus/pngsuite/basi2c08.png | 315 | `b2690d4475cdc39faf5a7d2de20de4e14eb96c6360fa791ec2003b4085ecacde` | png | unknown |
| imazen-codec-corpus/pngsuite/basi2c16.png | 595 | `ae13eba5fabbf7cbe8c01ec4458cdaa7e6bfdfcbd5109e831efaac9f39096027` | png | unknown |
| imazen-codec-corpus/pngsuite/basi3p01.png | 132 | `8e1edfbc0382e0b545c70209271cedead2d530df1ce40f5296f0749226b36006` | png | unknown |
| imazen-codec-corpus/pngsuite/basi3p02.png | 193 | `85f304eaaf6831b2bcc2c08892b947fef52f06337aaf23312d6326e367d73f77` | png | unknown |
| imazen-codec-corpus/pngsuite/basi3p04.png | 327 | `78890ee2c4da71e460b5a1527efe7dc17d673ebe997f49ca1b4dcd7347d21e56` | png | unknown |
| imazen-codec-corpus/pngsuite/basi3p08.png | 1527 | `ca103eef7a7c50abc7af9d5ec0dc9fdc07668e2f030adbce226e050dcec9eea3` | png | unknown |
| imazen-codec-corpus/pngsuite/basi4a08.png | 214 | `dfae01a4548e30519157bb51ce29d4de3b35b74288e9568b4d5911de01c6048b` | png | unknown |
| imazen-codec-corpus/pngsuite/basi4a16.png | 2855 | `ef7df23ccd912309a4f89ca3c3094bf5ab55add25218e571e51cc6cb11cfad9e` | png | unknown |
| imazen-codec-corpus/pngsuite/basi6a08.png | 361 | `fe70ea20c8447e82abb7bc9dd05344a61a4631cc69e0974378df8f6263af0337` | png | unknown |
| imazen-codec-corpus/pngsuite/basi6a16.png | 4180 | `7fdd6bf08f04692bcf06b5c4262e7f76c49d8adb992789fd3f05aa0435645cd8` | png | unknown |
| imazen-codec-corpus/pngsuite/basn0g01.png | 164 | `c8b1364d7771dd2f5a1b2d7d633abcf3f48dafee608558ecd2e5fc98f61894cd` | png | unknown |
| imazen-codec-corpus/pngsuite/basn0g02.png | 104 | `ca172e92d179c77b3d321ad501e452a59bdaafafde8ebd74fd0669c4eae58efc` | png | unknown |
| imazen-codec-corpus/pngsuite/basn0g04.png | 145 | `fb2d42c4c8f5c51590e675994a9b0c718fbf71c80e28142f231cfa7c5b0e26e8` | png | unknown |
| imazen-codec-corpus/pngsuite/basn0g08.png | 138 | `268d061075d1dd2eeec62b31303d09f6998549e1bfb447a5f09c80a2b0978ac3` | png | unknown |
| imazen-codec-corpus/pngsuite/basn0g16.png | 167 | `1a1fe155f40c11d79350b3f84c7eb2b29719037e57073cb7ae2ab9e8323f9360` | png | unknown |
| imazen-codec-corpus/pngsuite/basn2c08.png | 145 | `c90e86090a625661b19960cafdde6e347d6e32d73837aaae533f66dd3f099506` | png | unknown |
| imazen-codec-corpus/pngsuite/basn2c16.png | 302 | `1e1c28ec0ee5da6224404b4005076dd30e2335a1a80c0ca722046a245c4a2b3b` | png | unknown |
| imazen-codec-corpus/pngsuite/basn3p01.png | 112 | `c2d7cd682df5f74506b33a5d70c344aaee248fda79fdfef8e873426fd6f2b75b` | png | unknown |
| imazen-codec-corpus/pngsuite/basn3p02.png | 146 | `0466bb7ed9984cf03b70704564bcffab1df8ec0e8167473ba0f75e4fedce5a8f` | png | unknown |
| imazen-codec-corpus/pngsuite/basn3p04.png | 216 | `e1fc7be978d3149b98533d0076245ae64353b7967290f4204c1282ecb4ec1aba` | png | unknown |
| imazen-codec-corpus/pngsuite/basn3p08.png | 1286 | `d58256cd2eb16b5740d4c1403d25ce43d8dd03e270627ab709d2fb141e3d904c` | png | unknown |
| imazen-codec-corpus/pngsuite/basn4a08.png | 126 | `7be24b618bfd437b921ae0caf9341d112338c6290cc62466deb19d2c7a512968` | png | unknown |
| imazen-codec-corpus/pngsuite/basn4a16.png | 2206 | `1c92ffd11d2fc89a36f170d0239668436407f5c8e3f8d93483fb3fc6bca361d7` | png | unknown |
| imazen-codec-corpus/pngsuite/basn6a08.png | 184 | `559c594166eb156f461c9beff0f053196730dc998fdb0d2b801c89e6680860a5` | png | unknown |
| imazen-codec-corpus/pngsuite/basn6a16.png | 3435 | `8f9d81060aebf4576461403c5057de7f23f73157016b659402b906df805845aa` | png | unknown |
| imazen-codec-corpus/pngsuite/bgai4a08.png | 214 | `dfae01a4548e30519157bb51ce29d4de3b35b74288e9568b4d5911de01c6048b` | png | unknown |
| imazen-codec-corpus/pngsuite/bgai4a16.png | 2855 | `ef7df23ccd912309a4f89ca3c3094bf5ab55add25218e571e51cc6cb11cfad9e` | png | unknown |
| imazen-codec-corpus/pngsuite/bgan6a08.png | 184 | `559c594166eb156f461c9beff0f053196730dc998fdb0d2b801c89e6680860a5` | png | unknown |
| imazen-codec-corpus/pngsuite/bgan6a16.png | 3435 | `8f9d81060aebf4576461403c5057de7f23f73157016b659402b906df805845aa` | png | unknown |
| imazen-codec-corpus/pngsuite/bgbn4a08.png | 140 | `71d041df5c8949ce07d5e93b3c9f752cefc75ef7326c49df05ae73915f1a755f` | png | unknown |
| imazen-codec-corpus/pngsuite/bggn4a16.png | 2220 | `c45de44d3442bd33072d68456541b10e0cc57c5d8bfc809208995d939091eb2d` | png | unknown |
| imazen-codec-corpus/pngsuite/bgwn6a08.png | 202 | `2da3c3efa01bf166958852a104ece92daaede8ffb5e0452a55d40526258a8bf5` | png | unknown |
| imazen-codec-corpus/pngsuite/bgyn6a16.png | 3453 | `875bc2b44a4355551c51260def9664da68be1af8c14b82f76173aaf01ddb1929` | png | unknown |
| imazen-codec-corpus/pngsuite/ccwn2c08.png | 1514 | `c88909e74e039dd3df829bf24144b487171e53b17f5c5c07cbc08688247d24b5` | png | unknown |
| imazen-codec-corpus/pngsuite/ccwn3p08.png | 1554 | `dc365b39d49c287669d837872dd59aef30763a611dfc8c046c481e35e49a390a` | png | unknown |
| imazen-codec-corpus/pngsuite/cdfn2c08.png | 404 | `438018f19c85e582cb586ac7cca2220008ecb7fc70ce50e8f2a76b494c128a20` | png | unknown |
| imazen-codec-corpus/pngsuite/cdhn2c08.png | 344 | `a068eaf1f7040490e08eda3259befb6689849dd0ff8bb4cc03c705d117cb2b9f` | png | unknown |
| imazen-codec-corpus/pngsuite/cdsn2c08.png | 232 | `ee08dfa303a3c09171280fc1821180dc0a4c3591af7e9077e8ce0435642c76d2` | png | unknown |
| imazen-codec-corpus/pngsuite/cdun2c08.png | 724 | `a849d89ba3d92146940d7c56d2fe74c9c3ec96725c7f24eefaf44160a6304de2` | png | unknown |
| imazen-codec-corpus/pngsuite/ch1n3p04.png | 258 | `587a8624228d3f605f475bd751a1f3a97f0bbab590c0ff518bce5da3abcb6f2b` | png | unknown |
| imazen-codec-corpus/pngsuite/ch2n3p08.png | 1810 | `e3cace549047c6e5e693b9b135d53f7f9ca5b1088bf30cc408634598ba53758a` | png | unknown |
| imazen-codec-corpus/pngsuite/cm0n0g04.png | 292 | `79ccaf4abe5091e1f65f8a61496363ed3312ebb9ea1aaa98affadac3d98507de` | png | unknown |
| imazen-codec-corpus/pngsuite/cm7n0g04.png | 292 | `127bb50d224ac3ebff36160482a03b9e6686072e86c8ff4cd43e3ce2271b2315` | png | unknown |
| imazen-codec-corpus/pngsuite/cm9n0g04.png | 292 | `774b384d0ad73698e7d93fc5a29976b332c619045e5966276c609b11459a4152` | png | unknown |
| imazen-codec-corpus/pngsuite/cs3n2c16.png | 214 | `bc812de2b83abc9ae2a6d1ae01e91f9090214b9ed8fee1d56cdfea58f4f259d0` | png | unknown |
| imazen-codec-corpus/pngsuite/cs3n3p08.png | 259 | `267104dced0858dd828cdd41edc0e87042c7094c77191565192a67045064b23f` | png | unknown |
| imazen-codec-corpus/pngsuite/cs5n2c08.png | 186 | `028fa49fbba3954c2eba27a4c3607196e87c1dae74192df3b3ad7afe5e0a3f0c` | png | unknown |
| imazen-codec-corpus/pngsuite/cs5n3p08.png | 271 | `a7a4021983d6b22685529cbafb65cd087c9e1af1c5d205c2e13e3efc4ae87b6a` | png | unknown |
| imazen-codec-corpus/pngsuite/cs8n2c08.png | 149 | `d90ddab7313e4e1fd7f20f16a6c546b449697fbcac1a7776298a74896f4662da` | png | unknown |
| imazen-codec-corpus/pngsuite/cs8n3p08.png | 256 | `5bffdb88e307a851f8e85b137a69c59e557a881db816e990061934c0155c894c` | png | unknown |
| imazen-codec-corpus/pngsuite/ct0n0g04.png | 273 | `081d1ec26b4157fbc032b76dc716321420f2d032a425de046557c7842766826d` | png | unknown |
| imazen-codec-corpus/pngsuite/ct1n0g04.png | 792 | `259116f8ecf849d83d824688eb02b4575aed11980f02ab6fb123281c25a6459d` | png | unknown |
| imazen-codec-corpus/pngsuite/cten0g04.png | 742 | `4583e63d1bdfa18b6abb47439dee9a73bed311ed1b0a71d22bed75fe4767832b` | png | unknown |
| imazen-codec-corpus/pngsuite/ctfn0g04.png | 716 | `d0607280c3539a8934c5cfd22788b382cdc31321cdedc75ae8a29e3948580ba6` | png | unknown |
| imazen-codec-corpus/pngsuite/ctgn0g04.png | 1182 | `5f4c87f5a8f589d029a908050880ac5d6aed3810e55e75444802d6d3fb27cf33` | png | unknown |
| imazen-codec-corpus/pngsuite/cthn0g04.png | 1269 | `8ef799e59871755578e563c5b411bc3895c2f7112c115aaa921b6c04fe255bf2` | png | unknown |
| imazen-codec-corpus/pngsuite/ctjn0g04.png | 941 | `ca91332ecc04e5faac1f39ca4df4996b072a93f3e574e7f4b50d52aafbfe67b6` | png | unknown |
| imazen-codec-corpus/pngsuite/ctzn0g04.png | 753 | `c0765e635a6423ec64f0314400c3df20745c4a4469ffcc323c7b00ba66b4aceb` | png | unknown |
| imazen-codec-corpus/pngsuite/exif2c08.png | 1788 | `d04140d74bc60597c47b5aac371a3553d3add9354437bbd8c57007d94e197809` | png | unknown |
| imazen-codec-corpus/pngsuite/f00n0g08.png | 319 | `d055cc0bb505b37c6ecf88a808d71675eca5dd0ee683d70ebc9c0be0e1bb8e57` | png | unknown |
| imazen-codec-corpus/pngsuite/f00n2c08.png | 2475 | `0fe92b2aa2da04c885d1dbd85c834716f6cdd946364d97dcd597bb79d9e14427` | png | unknown |
| imazen-codec-corpus/pngsuite/f01n0g08.png | 321 | `956ddaf133e6d9a8d36f1e00604d87fbc2d0295e933bb8caaef517e7d87e5342` | png | unknown |
| imazen-codec-corpus/pngsuite/f01n2c08.png | 1180 | `ef072ec6815ebf9b33e0553d2e4e4e7ed6911860a2512c67bcd10a9f0f09b9de` | png | unknown |
| imazen-codec-corpus/pngsuite/f02n0g08.png | 355 | `1f5b49c06ecc2a1756f0423b3de936bd18497866d035ac8eded78a6f17408a2c` | png | unknown |
| imazen-codec-corpus/pngsuite/f02n2c08.png | 1729 | `ca4b937b3c587d5c007f193a2eec14dc96b0d23ff7d6aa9004e3badd1af9fe8f` | png | unknown |
| imazen-codec-corpus/pngsuite/f03n0g08.png | 389 | `d0563ae30c6ce7a01eae7a5cdc0ef780175bfa7653888ed93f17bef5fe4b2107` | png | unknown |
| imazen-codec-corpus/pngsuite/f03n2c08.png | 1291 | `2d101e3ef4f78a69437034671e93fe11faac0cfc4d44210dcca1b944caa886f7` | png | unknown |
| imazen-codec-corpus/pngsuite/f04n0g08.png | 269 | `fec1a3c53833d0ddefa4486a98934c393cb4335b2dc31da70e6540a4686f1457` | png | unknown |
| imazen-codec-corpus/pngsuite/f04n2c08.png | 985 | `c365c24153cb69fd3c162f00b296ae23a71a1595645d1aeb0ad23af680d7b4be` | png | unknown |
| imazen-codec-corpus/pngsuite/f99n0g04.png | 426 | `8ac0f095d2a943157e820fa121bccde08d5230af1b5830c3041d5f4da3524eba` | png | unknown |
| imazen-codec-corpus/pngsuite/g03n0g16.png | 345 | `3494b914dd1b094afa9a74a89bfa75219030e21af6fca3ed66c9d45032a047e9` | png | unknown |
| imazen-codec-corpus/pngsuite/g03n2c08.png | 370 | `abce774b9624952c2d0c57ff681790ba620cf5616fe7e0ef0600600cdce3c22a` | png | unknown |
| imazen-codec-corpus/pngsuite/g03n3p04.png | 214 | `541389db0c72721c6c49501e1dbf6e32df41b4fcfa318676955e278f3f4332b3` | png | unknown |
| imazen-codec-corpus/pngsuite/g04n0g16.png | 363 | `72350a2d9db2df09b626f1f1dd48061e9c749d471bf19814d2c5c10acbf007e5` | png | unknown |
| imazen-codec-corpus/pngsuite/g04n2c08.png | 377 | `bfd3edfc4d85a43383556a51023533fa3888184aa53a6b43769910782beebfce` | png | unknown |
| imazen-codec-corpus/pngsuite/g04n3p04.png | 219 | `5ea85ebefb58b2ab113fc05bf1cb79ffb068359e3a5620843590a0a7b59bd49a` | png | unknown |
| imazen-codec-corpus/pngsuite/g05n0g16.png | 339 | `be19721d28e0b268af1e29e8190c952b94315bd08899383ae2c91e6dc8c4f889` | png | unknown |
| imazen-codec-corpus/pngsuite/g05n2c08.png | 350 | `74ab5b8477992d65e220eeaff8df466522c1b392fa90c6f9935da5bdb7113c9d` | png | unknown |
| imazen-codec-corpus/pngsuite/g05n3p04.png | 206 | `2f46afd7ec15836b523cbce6965f34d89833b8d777afffaf0f53bce620d5f65e` | png | unknown |
| imazen-codec-corpus/pngsuite/g07n0g16.png | 321 | `9070f843981f765cc8e26a63751be5d58631d85a8a7b4e826358f80e8a679d03` | png | unknown |
| imazen-codec-corpus/pngsuite/g07n2c08.png | 340 | `ca4cd32d222f65fb7beb7c9f40d8b6833b36d552b830ff1a1d67dae73b8ed0d8` | png | unknown |
| imazen-codec-corpus/pngsuite/g07n3p04.png | 207 | `b8e7abeabcfd50b71cca78b6cdff7372310cfc179cd63304c3e904f469b333cb` | png | unknown |
| imazen-codec-corpus/pngsuite/g10n0g16.png | 262 | `a22486acb74ee5f947db3a20b1f314a9dd8aca3339840049ee559f4d676a6b5c` | png | unknown |
| imazen-codec-corpus/pngsuite/g10n2c08.png | 285 | `4ac23729aea109e8f6b1e831448115cf02dcd97559e9403847cbe6dd7e5c7347` | png | unknown |
| imazen-codec-corpus/pngsuite/g10n3p04.png | 214 | `36cc2ea4b5b33cd18e0a01c7de85dbcaf7161d258cd0f2265a90cd835b15cf6d` | png | unknown |
| imazen-codec-corpus/pngsuite/g25n0g16.png | 383 | `1fae707d809296d2cf0d6aa653bead6199644fb1c859558ec7d2d69e709a423a` | png | unknown |
| imazen-codec-corpus/pngsuite/g25n2c08.png | 405 | `9b128cfa1bb417dd99251914d729062621fcea9f346168549b16a75fe030b0f6` | png | unknown |
| imazen-codec-corpus/pngsuite/g25n3p04.png | 215 | `4197a0a25c4f74d42c2285d75b9fabe1eedbed45bc224ff1ec1784f5797e9dbf` | png | unknown |
| imazen-codec-corpus/pngsuite/oi1n0g16.png | 167 | `1a1fe155f40c11d79350b3f84c7eb2b29719037e57073cb7ae2ab9e8323f9360` | png | unknown |
| imazen-codec-corpus/pngsuite/oi1n2c16.png | 302 | `1e1c28ec0ee5da6224404b4005076dd30e2335a1a80c0ca722046a245c4a2b3b` | png | unknown |
| imazen-codec-corpus/pngsuite/oi2n0g16.png | 179 | `142bc4b1e9f8a9e3b0ba3d2c2025e485bf7e76df88f914bf8c9041b4562cc080` | png | unknown |
| imazen-codec-corpus/pngsuite/oi2n2c16.png | 314 | `2c523f138e0ade1bed8f31d59ec0f34b82660b192d6af8b8f395f82b9ba9dabb` | png | unknown |
| imazen-codec-corpus/pngsuite/oi4n0g16.png | 203 | `aa2d77723ba44f654a41a2ab97e01271fe942fecd2f299c0a81da90acb2887ac` | png | unknown |
| imazen-codec-corpus/pngsuite/oi4n2c16.png | 338 | `661220a0ed03ca6d63ec8dcaac738d4a9fd089b491c40dd896267ffb6cf5015d` | png | unknown |
| imazen-codec-corpus/pngsuite/oi9n0g16.png | 1283 | `ae70c9effd0d9957a0d42771bc987529a1f3715e068057fae63f0c7e50d5c53a` | png | unknown |
| imazen-codec-corpus/pngsuite/oi9n2c16.png | 3038 | `fef98e9bebe6c4046c29f2568f7a735305c8661aa01f9c37a718135e5bc4f941` | png | unknown |
| imazen-codec-corpus/pngsuite/pp0n2c16.png | 962 | `72406b6173ec20dd059e8cea594ef5bc8f81bac5e416e2b53058d2debd51d195` | png | unknown |
| imazen-codec-corpus/pngsuite/pp0n6a08.png | 818 | `d5a6f964a601a5e1815525117c12c32b61e2aa09fd6040776d35f2f7115b7110` | png | unknown |
| imazen-codec-corpus/pngsuite/ps1n0g08.png | 1456 | `b321b9ac8f2aa641475b6936365954181726dcb8662dbf641284d82a83cc22a5` | png | unknown |
| imazen-codec-corpus/pngsuite/ps1n2c16.png | 1620 | `6c59d673032fe2d04dbd2ea91cc9bc7bebe7d5ab84911f00e36fb28994793576` | png | unknown |
| imazen-codec-corpus/pngsuite/ps2n0g08.png | 2320 | `bd2ae1b45fd771aaa8c57dccd183f3834fc9742f6dfc692606865049efb116e5` | png | unknown |
| imazen-codec-corpus/pngsuite/ps2n2c16.png | 2484 | `120c62ce9d014f7772c4b38a446991b5bbe6a22ef5ea59239d32e023bc167585` | png | unknown |
| imazen-codec-corpus/pngsuite/s01i3p01.png | 113 | `235eb82f1337e3fcefbdca566a53af3d3523db7588ba3cd7fa5dab19afe48a41` | png | unknown |
| imazen-codec-corpus/pngsuite/s01n3p01.png | 113 | `6a4f6da9fe36d195219ad2beeac1a0423e2ee6de03dfb064a3b6fa31623eb230` | png | unknown |
| imazen-codec-corpus/pngsuite/s02i3p01.png | 114 | `e7d26ab4b31e7066b0674a4374c093967a9f1761b96836aa3dbe624acd73ab52` | png | unknown |
| imazen-codec-corpus/pngsuite/s02n3p01.png | 115 | `f4b324f2b1d013ee77f632e42129c7cd3eca55da846e775e744a1f224ad1efcd` | png | unknown |
| imazen-codec-corpus/pngsuite/s03i3p01.png | 118 | `4513dec80f54ffd04a28834b114254d6e6d66e52e32e0059174474f2fb15d6bc` | png | unknown |
| imazen-codec-corpus/pngsuite/s03n3p01.png | 120 | `4dee297bd7f747f87488509af11a1e1e0531fa67e6e8d0f8ab7f4df7940f0ff3` | png | unknown |
| imazen-codec-corpus/pngsuite/s04i3p01.png | 126 | `918f94f3557e10de91efa680df507c8eafc347fa5023af43037701398128ad0f` | png | unknown |
| imazen-codec-corpus/pngsuite/s04n3p01.png | 121 | `e73c52f764b684ec5133cce11f7f18cc60065acdd308e2c3d871e0a792a1080e` | png | unknown |
| imazen-codec-corpus/pngsuite/s05i3p02.png | 134 | `77fe040e17167f9656afe46cf0031832e635745e4e7f19ba12dee32f5ec03d96` | png | unknown |
| imazen-codec-corpus/pngsuite/s05n3p02.png | 129 | `1b9e244a5c1d6cc9830391fff4eac565ada026d000e60faf7525c8add6bdc726` | png | unknown |
| imazen-codec-corpus/pngsuite/s06i3p02.png | 143 | `cf8d5fdb34c0afd38b1b4745bed6167771767ccdfe847c4d8766f7fcc5c41176` | png | unknown |
| imazen-codec-corpus/pngsuite/s06n3p02.png | 131 | `5caabfc4b147fad5e49e558143faaab91888324240acf45e5db8fc49f7a7f667` | png | unknown |
| imazen-codec-corpus/pngsuite/s07i3p02.png | 149 | `d9874bfad10353a9ea2876ee388c3e7f81f697ed141d0d79c5c2019d62a7a698` | png | unknown |
| imazen-codec-corpus/pngsuite/s07n3p02.png | 138 | `e7d447394f5fa64c27353216af387352a77a1fb534922a2d974e60d965d4e414` | png | unknown |
| imazen-codec-corpus/pngsuite/s08i3p02.png | 149 | `62adf855c6b1e3a007f9dcf3ce2ba244616c089269a511dd939e89a4b0853453` | png | unknown |
| imazen-codec-corpus/pngsuite/s08n3p02.png | 139 | `544fdd476e566e8aef4c98604124ae05acef48be20d1aebb9b6674b08b2abbb6` | png | unknown |
| imazen-codec-corpus/pngsuite/s09i3p02.png | 147 | `f2cf5b3109690704d106a0b22ea079e36064cc6077e1fb9a1ba87397d0bbcca1` | png | unknown |
| imazen-codec-corpus/pngsuite/s09n3p02.png | 143 | `6be8f58b638e7f7114750f5796f66f650db8fb7242a36183850f02117f4eaa65` | png | unknown |
| imazen-codec-corpus/pngsuite/s32i3p04.png | 355 | `a27e0dbf923ef868e7399560b76c23a50b2d8926cddd9775e2bc4e050273f205` | png | unknown |
| imazen-codec-corpus/pngsuite/s32n3p04.png | 263 | `c80d9fc7ded0b7834ec11d0e324540c7be74016b61bc302a1d167218fa35fbf9` | png | unknown |
| imazen-codec-corpus/pngsuite/s33i3p04.png | 385 | `cc6ad98dcf686d92f1165d951f90fac70e568cedb1fcbba33e8890d0e6cdad4d` | png | unknown |
| imazen-codec-corpus/pngsuite/s33n3p04.png | 329 | `998d08e084e3eea288984475bfed0d48ee2d8250e20b96755898b59152e36a34` | png | unknown |
| imazen-codec-corpus/pngsuite/s34i3p04.png | 349 | `83eb2e82eb14ae3c608833ef371a6f472c4c6e63b7e9f4f92f5472f975793b97` | png | unknown |
| imazen-codec-corpus/pngsuite/s34n3p04.png | 248 | `a25451168c0b03ab8f52dcc60c6b9c12bc5df5d55afabe1892b87d0a856bb4a0` | png | unknown |
| imazen-codec-corpus/pngsuite/s35i3p04.png | 399 | `db5988c27ad577de1e494cb50229dc2772678531adde2db84493907eae003e54` | png | unknown |
| imazen-codec-corpus/pngsuite/s35n3p04.png | 338 | `cd99fc4cc69bda1ff8e8697d8b423ae8d9e84a58ba1d2b480751953b6869e3b3` | png | unknown |
| imazen-codec-corpus/pngsuite/s36i3p04.png | 356 | `a36b40927b730a31d60c7818fb4a32e67ace06393cdaa26edc09520b6cee066d` | png | unknown |
| imazen-codec-corpus/pngsuite/s36n3p04.png | 258 | `ebc08f6a1e0918c5d3a9a08e184c23019a3cf90d8843e4b71bf2ae16040b1a84` | png | unknown |
| imazen-codec-corpus/pngsuite/s37i3p04.png | 393 | `565c79404c4b9e46c27edb2f93d7b26b93ec0a0481ab7a21fc405152a21f53ba` | png | unknown |
| imazen-codec-corpus/pngsuite/s37n3p04.png | 336 | `964078b1f3f472268b8ac97a8976b4d1cdb6a47e6243d67eddcb0205e65b9f61` | png | unknown |
| imazen-codec-corpus/pngsuite/s38i3p04.png | 357 | `b107f120ffaffcb949ac4547e0f91555ac681f78c7e68c724e7ceddfd8e5387b` | png | unknown |
| imazen-codec-corpus/pngsuite/s38n3p04.png | 245 | `045b0f5ea35874741bf6cac40f2e63ec8726450ab241475df4b7e9303c39e339` | png | unknown |
| imazen-codec-corpus/pngsuite/s39i3p04.png | 420 | `4b5a6d8c04c8c70e1de3bcb6f7b5cc3ba359b13e28de6f52e21a291d4bc8a937` | png | unknown |
| imazen-codec-corpus/pngsuite/s39n3p04.png | 352 | `2115b6cad0140ea97fe6ec056b47307ef1e8b5c00db5f08707a0572b165e5f08` | png | unknown |
| imazen-codec-corpus/pngsuite/s40i3p04.png | 357 | `48a3f19b5c3b2f7eca17fd34765a2a3e385d770f24c357bc66bd74417eb60a5a` | png | unknown |
| imazen-codec-corpus/pngsuite/s40n3p04.png | 256 | `c4598ea73b1ec015bef7dcfd7f67bc7bfc41546619953d1a92cd9b8657a7033a` | png | unknown |
| imazen-codec-corpus/pngsuite/tbbn0g04.png | 429 | `c5e7eeaffa677bfac002ee968a0423e0fea3be7701d39ccd6a015df1d2d85e40` | png | unknown |
| imazen-codec-corpus/pngsuite/tbbn2c16.png | 2041 | `8fcfd031a5b716201854fdab25691feed6cd3ed7b713a51b94e1f43fc63fe0c1` | png | unknown |
| imazen-codec-corpus/pngsuite/tbbn3p08.png | 1499 | `8eb43a6020fda8ed7c8c9b88b974ef794ee8452db29212ae7e5c11003bfd76a3` | png | unknown |
| imazen-codec-corpus/pngsuite/tbgn2c16.png | 2041 | `49711ee271f96099521b83b75d58ed2f76d42ed46cb3c06656fde2cad697cf59` | png | unknown |
| imazen-codec-corpus/pngsuite/tbgn3p08.png | 1499 | `6f798628935a021fe446dce3d62861d1f7369aaf01bad10daa4917c5abccad7d` | png | unknown |
| imazen-codec-corpus/pngsuite/tbrn2c08.png | 1633 | `8223d8b0c5f84b149f0c1f0e1f658346e07fcbd03ffc02b2e9eeea1481eb19bf` | png | unknown |
| imazen-codec-corpus/pngsuite/tbwn0g16.png | 1313 | `01e86f108b244bdee4d72e384aced8a62369965ca2993ee6ef88f131c647f7d1` | png | unknown |
| imazen-codec-corpus/pngsuite/tbwn3p08.png | 1496 | `978b28cec43bd219517083b63661bb30a7b9cdf9fd4476ab4e70844565980d51` | png | unknown |
| imazen-codec-corpus/pngsuite/tbyn3p08.png | 1499 | `7b4eb64b4bd7eb36417752873ddaca027ce77a07f474b2af569f4eea1e984111` | png | unknown |
| imazen-codec-corpus/pngsuite/tm3n3p02.png | 116 | `f05e317f64a038123faf96fdbd6fc3ab3eec14e1fc1eb87fd7da4d996be63526` | png | unknown |
| imazen-codec-corpus/pngsuite/tp0n0g08.png | 719 | `a253e055d8cd94049cd95e9392e7aa60f3d5c922a8f0cccb84762b0c5f547545` | png | unknown |
| imazen-codec-corpus/pngsuite/tp0n2c08.png | 1594 | `5dced3fde56b950e61ce86f4ad54458336f66389ce8ca68524d4fd8ec546ff5b` | png | unknown |
| imazen-codec-corpus/pngsuite/tp0n3p08.png | 1476 | `da40ddb18bd45db32ed03dc89e2250b096d808efe975a88477e4f5a91a4677c9` | png | unknown |
| imazen-codec-corpus/pngsuite/tp1n3p08.png | 1483 | `50bc927fe6cf1816454a7c27f8c743734be8db45e37e5ee3ede540f4e895e6c5` | png | unknown |
| imazen-codec-corpus/pngsuite/xc1n0g08.png | 138 | `4059f7e6a1c5bac1801f70e09f9ec1e1297dcdce34055c13ab2703d6d9613c7e` | png | unknown |
| imazen-codec-corpus/pngsuite/xc9n2c08.png | 145 | `e252a0e7df3e794e52ce4a831edafef76e7043d0d8d84019db0f7fd0b30e20f4` | png | unknown |
| imazen-codec-corpus/pngsuite/xcrn0g04.png | 145 | `3c0c2a68dd416a7be79400e0e2ceb358ba3191d5309d4bad9dd04b32ff6d5b60` | unknown | unknown |
| imazen-codec-corpus/pngsuite/xcsn0g01.png | 164 | `71e4b2826f61556eda39f3a93c8769b14d3ac90f135177b9373061199dbef39a` | png | unknown |
| imazen-codec-corpus/pngsuite/xd0n2c08.png | 145 | `c1287690808e809dc5d4fb89d8a7fd69ed93521f290abd42021ca00a061a1ba4` | png | unknown |
| imazen-codec-corpus/pngsuite/xd3n2c08.png | 145 | `00b53c3bbd0641454521b982bc6f6bcfda7c91f1874cefb3a9bac37d80a1a269` | png | unknown |
| imazen-codec-corpus/pngsuite/xd9n2c08.png | 145 | `16e5b40fb2600db1af20fb79ff715c2869255e2d4bef20702f16534e5dd6a847` | png | unknown |
| imazen-codec-corpus/pngsuite/xdtn0g01.png | 61 | `f9d1fb2a708703518368c392c74765a6e3e5b49dbb9717df3974452291032df9` | png | unknown |
| imazen-codec-corpus/pngsuite/xhdn0g08.png | 138 | `318864720c8fc0dbe4884035f2183cc3bd3d92ec60d447879982942600e9fe2e` | png | unknown |
| imazen-codec-corpus/pngsuite/xlfn0g04.png | 145 | `968fd21abb8acf40fbca90676de3abcb3a6e35b01ba7a3b9190184eafb99c83d` | unknown | unknown |
| imazen-codec-corpus/pngsuite/xs1n0g01.png | 164 | `776701227c7094dd10b78f508430b8ea4f03471d072096382cbcca628dea1d2b` | unknown | unknown |
| imazen-codec-corpus/pngsuite/xs2n0g01.png | 164 | `9dd7e93ba9211f0caee09d8f12e37742936c469f45fcad21e577c9f0640cf99e` | unknown | unknown |
| imazen-codec-corpus/pngsuite/xs4n0g01.png | 164 | `166c8633d116d1c26631cb98f3a75340cf4385fa7ae6a67913bc78e709bcb30d` | unknown | unknown |
| imazen-codec-corpus/pngsuite/xs7n0g01.png | 164 | `7a380568beeac969908196ac89cd2347c96ac2f26fdc2b8e0314b62c59f0e308` | unknown | unknown |
| imazen-codec-corpus/pngsuite/z00n2c08.png | 3172 | `e4767d3259e1b331c9ece9fb07fc30f385879ac12b3cd0e1cb923f3bfac81dcf` | png | unknown |
| imazen-codec-corpus/pngsuite/z03n2c08.png | 232 | `939abfc6e0a3e349bb5bcd8c4e427a6cdb2c7e0c23a773aefa1c4fc9f07e4cb4` | png | unknown |
| imazen-codec-corpus/pngsuite/z06n2c08.png | 224 | `21652fe42f472acd83dcb207806add5737db0020b21d6b38b0a00be3e9e37990` | png | unknown |
| imazen-codec-corpus/pngsuite/z09n2c08.png | 224 | `98d90a7e61aa1a9ac9d99af44dd25c70cd5a7b4a11a85da60f82923e18a78f9f` | png | unknown |
| imazen-codec-corpus/heic-conformance/edge-cases/avif_brand.heif | 24 | `5b456c9d667bfffe29cb898a91fa5e462c0b38b72970f769814c5fe05033571c` | avif | unknown |
| imazen-codec-corpus/heic-conformance/edge-cases/double_ftyp.heic | 48 | `98dadb8348e18637ba9b6f6c61140c40cfae1ea42c7042427a889cf972697363` | heif | unknown |
| imazen-codec-corpus/heic-conformance/edge-cases/heix_brand.heic | 28 | `65fa11c1f322467a2840213a2b7c4fbbd4169cd9be25ad3bb3b9c6d1f31f0431` | heif | unknown |
| imazen-codec-corpus/heic-conformance/edge-cases/many_brands.heic | 240 | `516624b5e147e84e7bafdc3e47266c911d23ebacccccbd49c59f4c2e43aeffca` | heif | unknown |
| imazen-codec-corpus/heic-conformance/edge-cases/minimal_ftyp_only.heic | 24 | `aa851079b2c21112b6443adcd50ad28d61fb79e486786db29b90c979fded2b64` | heif | unknown |
| imazen-codec-corpus/heic-conformance/invalid/bad_ftyp_magic.heic | 264 | `2918aaf37f89b1751d442f7ddbec2f566807b4b86430ac19e014213cbe2a7046` | unknown | unknown |
| imazen-codec-corpus/heic-conformance/invalid/bitflip_c002.heic | 111897 | `a553b77fb21766dc6ffeb2e48a6dd4f4caaf3c45a01a5c72c169cfa21be36b14` | heif | unknown |
| imazen-codec-corpus/heic-conformance/invalid/corrupt_after_ftyp.heic | 1056 | `993bf2a1cdd5b0d28e37be2e3678ee12211aeba3076010450369946e12c21ee4` | heif | unknown |
| imazen-codec-corpus/heic-conformance/invalid/oversized_box.heic | 36 | `f863296e3ef6fc8c3f91103bc90888ab473772454edac615e0e9161860064653` | unknown | unknown |
| imazen-codec-corpus/heic-conformance/invalid/truncated_100bytes.heic | 100 | `e9eafd8fb103d34329b89b3f48fd58512b6c20159830aaa889393dd29f9d24d2` | heif | unknown |
| imazen-codec-corpus/heic-conformance/invalid/truncated_1k.heic | 1024 | `b2b130b90021267c11151ce59ddfacb5479bd930e2bc201589fbca9bb1df3d11` | heif | unknown |
| imazen-codec-corpus/heic-conformance/invalid/wrong_format.heic | 24430 | `a016a38bbd6480fff19273e25a69ed5382b596e9b402336bbbbca0b12cd8dd05` | jpeg | Google |
| imazen-codec-corpus/heic-conformance/invalid/zero_length.heic | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` | unknown | unknown |
| imazen-codec-corpus/heic-conformance/valid/dsoprea-exif/image1.heic | 2994394 | `335699d7ba7b4b4581aed0d995aefa57ef1e6771b66595719768cd313fa2430c` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/dsoprea-exif/image2.heic | 2540019 | `3ca296eaa15c4dd912a6e0dd76ce3bc9cbe80a61e570043b00ecfaba4d70d6a6` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/dsoprea-exif/image3.heic | 1148790 | `85b3098fb5b0f364958c0e18a5ec13ddde5369826db936021dfa909a3a85b46a` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/dsoprea-exif/image4.heic | 41465 | `676b0a76dcaa7fe9ffc41110b7791bef6cf0bfdb32455b03e149b0f8bfdb0856` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/example.avif | 113604 | `54a0dc31d02b6f5d9d4b66027d4787861b7af15ffd8fab8eab963d10c5411469` | avif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/example.heic | 718114 | `7f8b363e4936c0666a25f64f3a92fda10bd8e5453be4592530b65a55dd98f3f2` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/lightning_mini.heif | 4726 | `47bdf004cf1abb77498917dc5a91f01b18ae1b2985113585595441b57fbf4a84` | unknown | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/rgb_generic_compressed_brotli.heif | 554 | `5a052b3bb39b389e1b5d6c0bd0d60008aee4face533ccbac51a411b5e4b33616` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/rgb_generic_compressed_defl.heif | 631 | `c7e845189dc486f18694d4fdc2530bda365a4f84c9e98fa84b0283670875cd40` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/rgb_generic_compressed_tile_deflate.heif | 692 | `897c2d853363cd890483d68cf0ce0b897f5342778fc1709c0eb859281f214990` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/rgb_generic_compressed_zlib.heif | 647 | `7566711a2e6d911a2399a267b7229e8f59d14f65d2ea61e8458ae884dd221115` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/rgb_generic_compressed_zlib_rows.heif | 2582 | `e3a2f88b3b2fab61ca3d573a2ae22da2e5a69bcaf2186fbed30b070a1f278f86` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/rgb_generic_compressed_zlib_tiled.heif | 770 | `e58ab4e02efd8d31c2846ec10edd28669511d0045c77cefa5969f5e706b485ea` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/simple_osm_tile_alpha.avif | 804 | `7f72ab2da86d136cb25c0df11d63372847866271a1e648b6a63152aeb6c32f0e` | unknown | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/simple_osm_tile_meta.avif | 4404 | `20b1107a8622036be371c5aeb781e0bb3b2e1ecf15aa99dafa238b67c4303913` | unknown | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_comp_ABGR.heif | 2811 | `f05a3784ea2d29e1764d15b1178fe17b955644fa83873777e0feb59552423861` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_comp_ABGR_tiled.heif | 2811 | `b72997f79c6609046c64e98036648d68132d6622954a11587c8562bba680c016` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_comp_B16R16G16.heif | 4004 | `bd73426262f9a6f6bac73cabc33d0f0bd438651d5c1925c8b245f4218c33c031` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_comp_B16R16G16_tiled.heif | 4004 | `bca648bb65813f4af932efd9c20b2514e85da3cbbf0169778cb3c4126b7918d8` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_comp_M.heif | 990 | `6dd5dc74cf27334ed720860a54713ae117146d61613b082672028b61bbfe9e03` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_comp_M_tiled.heif | 990 | `f02c4ad502043012c2a61e5b85758fdafa3bf033a7a59bef787086ac9acd12fa` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_comp_R5G6B5_tiled.heif | 1684 | `70c10711408ed2a41c20d8826f81d603b4fbe617d8313acc966720b59bf7b3c0` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_comp_R7+1G7+1B7+1_tiled.heif | 2204 | `9f1eda35b27a68e158354868d08671fd3cda9c17e455dab821e239dc178bacb5` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_comp_R7G7+1B7_tiled.heif | 2124 | `d08aca29a4e5bc51831d57c9a73c893480bd544ae30e17e782e938ee6fdbe949` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_comp_R7G7B7_tiled.heif | 2084 | `e8e03a962599835d0017fb2ee1114d8a0f485b72f2533d795a42ff2d804e6441` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_comp_RGB.heif | 2204 | `722c37c1292a61b5dcdfb49fdf5288f61c87d9831de228f0fc63c078b06b7d19` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_comp_RGB_tiled.heif | 2204 | `04a071526fd28948f0fff38b7d96ecbc4257469df2df5c778b207ee58351c875` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_comp_RGB_tiled_row_tile_align.heif | 4252 | `c62fc71b10648233c941303d12ad72a40b972c7c7befc90061dae3276abc8c8b` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_comp_RGxB.heif | 2811 | `a2981876a4942e9553f2635145d8d9353e99610f1fe70c02059a0836f1ff3c72` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_comp_RGxB_tiled.heif | 2811 | `93e975b3055f56605ab16de945cfb2923f457435767722c53191e8b25b17f05d` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_comp_VUY_420.heif | 1364 | `2f012b3eb0fd2359d83ca2e82491e55265a8695c781e17cf7ff59297436530be` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_comp_VUY_422.heif | 1684 | `7293c1ba7853463b126d7180d36732c87c543f47ae6bddcb11931cecd3e373f8` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_comp_Y16U16V16_420.heif | 2324 | `5ed2c64184d8c8f6e15d6a95745846e59a05044930a3ef6ece945e6807b64483` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_comp_Y16U16V16_422.heif | 2964 | `a3dbb47556e569da0c606a03a83b96d338f73feafed3b909401ed5de9074db81` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_comp_YUV_420.heif | 1364 | `d7e0b0ff7f00d8164d8cced629b5751723a6b67ba9f20d3ee1e5d376ae336422` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_comp_YUV_422.heif | 1684 | `9842bc36996f92d056a18629ef6d10a3609f10a250f62c16ec880c8d71bfea1a` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_comp_YUV_tiled.heif | 2204 | `be71ae70faf4427c7bd913014ecdfa6045d314190177da318d82a7193b165bab` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_comp_YVU_420.heif | 1364 | `2618ed6fb147ffb4448c10c963cd8065900d2b95d9b7040d7fcb622a527a6cc8` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_comp_YVU_422.heif | 1684 | `7b5f92e926f4fe4da490207e535d5dd2444a17e7a12a9e8350333d6b66ff7131` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_mix_VUY_420.heif | 1364 | `be4d9cd358d35ff529bf27939828231a2d324dd7106aa5d577fa1b017399aec7` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_mix_VUY_422.heif | 1684 | `5195ffcc154ca0f954843087559aaf7adc47366ef15944ff096d7685c8e7e2d4` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_mix_Y16U16V16_420.heif | 2324 | `3684a4dc47128a02268dbf8ca33b5f1d49610ee790090d28c7434d34bd1b3647` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_mix_Y16U16V16_422.heif | 2964 | `f572d834e0ba7272c70f87f507a0492b384c5cee808a3842e02af828aec20c54` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_mix_YUV_420.heif | 1364 | `9cf6f4532fd3ad6ca5802de054504710a30fc09f7fcd077673e79f1c30040e86` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_mix_YUV_422.heif | 1684 | `95df6fd190efd5818065708a407f195bb8d87b0192ce8218361d63bb63a82305` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_mix_YVU_420.heif | 1364 | `35aab2c6915dcdd316f14de539fe12f238c63cc431d46b5be1eeafbd32a231a3` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_mix_YVU_422.heif | 1684 | `0de60ae399000e1f99095c4dc1cecc5b5fae7c58bbb0e0ca054a7fd44d95f707` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_pix_ABGR.heif | 2811 | `156fbeb07cc5bfee3c8cf7849720d721a84799af7b301422f69507679ca01654` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_pix_ABGR_tiled.heif | 2811 | `d5b6750a56fa0ebde2f9a712b3d9dd6610384c981c185258a8aa19cc0ecca2e6` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_pix_B16R16G16.heif | 4004 | `0de9b0d862e1f50627a6f80a00e5475ee0b04eab2e481f2ca2ce0c9582175c30` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_pix_B16R16G16_tiled.heif | 4004 | `89e1b0cc6cc53117f31ac95d6f203a0f3c2d765cd400e24401775f070490f41f` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_pix_M.heif | 990 | `469be5b476c11d6dd4d888a5885f01fda574c2a44777fa47ede72371714c0b2d` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_pix_M_tiled.heif | 990 | `1aa68752a776fdca113cfdb901ce074ea5cdf240fb32ac777d107f15cb1726ba` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_pix_R5G6B5_tiled.heif | 1604 | `b1c1b665797d23e4d11123d8ee25119bf17afb170e220208131f59196cdc283a` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_pix_R7+1G7+1B7+1_tiled.heif | 2204 | `f91482fad2443af62e0dc1e31713afa693f3a8cde56b05da6500397c6ae96d83` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_pix_R7G7+1B7_tiled.heif | 2204 | `8fb796dd8954dde384ee5b7e9981a893ab20ffd2dda91e8fc28e6ed450043d25` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_pix_R7G7B7_tiled.heif | 2004 | `43d6230e78c45503f713bc8431d2f87789a3830891b914c16c055bdac175840e` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_pix_R8G8B8A8_bsz0_psz10_tiled.heif | 6411 | `15df94b6f3baae5396858018159c074594cd8379b74ac361f039cea6bc207e6b` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_pix_R8G8B8A8_bsz0_psz5_tiled.heif | 3411 | `bb3a6eb6b33f6c3473bf344c2262954e49419914c29b78f7f2f4167b83e8917a` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_pix_R8G8B8_bsz0_psz10_tiled.heif | 6404 | `f12a368c2a0d085a7ede27c7a5849b333209fb5496c1b214cd1cf23821d7b25a` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_pix_R8G8B8_bsz0_psz5_tiled.heif | 3404 | `ba1a95b37096c0b10db5c47be5fe9f3f3c4874667749052c63ee04391b7bc39b` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_pix_RGB.heif | 2204 | `30a001333302cd2a850149c757754981eebfeed9509bc3ac7f2633c49141eb12` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_pix_RGB_tiled.heif | 2204 | `2110b972aa762de48949cc0a5166581446d19cc530361f91c69b8a04cb585ade` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_pix_RGB_tiled_row_tile_align.heif | 3068 | `90267658158076ea7189630f337e1f1568b89a39a5bece6e5543dbe4dd4c7bee` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_pix_RGxB.heif | 2811 | `1897d67ea2325a7762e14e94c5d126401a436c94b43b9565bb9e84dc3c1ccc69` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_pix_RGxB_tiled.heif | 2811 | `c53ecf9b3070aaf8445382511c6979993eec6dec7e075e101299dc207c7534be` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_pix_YUV_tiled.heif | 2204 | `38dbfdaa384fc82b59f7d41a01108beeed560de5305c977410adbde814222d6c` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_row_ABGR.heif | 2811 | `aa9bd9e7dc9fbe8b86289080682ccbbed4bdc9e7f476ad45982dbc2772d0a59b` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_row_ABGR_tiled.heif | 2811 | `7cef490aac9400e1ed624953ccf6adb758beace61e25dd400267218e968d4192` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_row_B16R16G16.heif | 4004 | `f9aa3e065c1973df1e3d540e0cfb5d157b2f3bf078c0efc0122671c4d3671cbc` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_row_B16R16G16_tiled.heif | 4004 | `b8614fe3679d5054e370d78e56b7fee0d8cd5ffe25386df7b66e220d87a667a7` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_row_M.heif | 990 | `d8fca5e777aa9328076940e686de1fd14d3d4cb8d1b991bfac1f9d9da7e76f9f` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_row_M_tiled.heif | 990 | `dfb142f87db7aaf71274c177ed6fa6699d61c51c2dd42d0437551a13ba592906` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_row_R5G6B5_tiled.heif | 1684 | `3ad36c243233a652a082cb73135a21c2fcfdcbcf97dff1dd523b7836923d5225` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_row_R7+1G7+1B7+1_tiled.heif | 2204 | `4e81943d78c87bde2f2af54287c33650f68c5d7e0da0a72f7a39297c7330f932` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_row_R7G7+1B7_tiled.heif | 2124 | `bd8497a39a3077af9f8f50847eae2ef87a82faf0c7f3e144afdfdad509290f39` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_row_R7G7B7_tiled.heif | 2084 | `e367c8bb9c1934bc6bd999f742f7e447e5c9eedc59e797e5f76c5dd987e849a3` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_row_RGB.heif | 2204 | `29dd02b5771a242d8fba1ea859cdc370757b91754cc2bbccd7de378c889f4b8c` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_row_RGB_tiled.heif | 2204 | `b0b09111a6681d9d6395780fe5d91e9e245120a6e763be1663e5266047729f48` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_row_RGB_tiled_row_tile_align.heif | 4252 | `1012d271cbcffd17955429f31fd8874f69aaaf2d55d38064f72e130e7db40e14` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_row_RGxB.heif | 2811 | `ec9a494b547b88ce9a2e6d05972980bd9b590620243fdc3585deb9ed605fbf12` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_row_RGxB_tiled.heif | 2811 | `7e9cd63018ebb88dde661d6a200c5ac8f87cab31bfe9be211a6851205e2dca55` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_row_YUV_tiled.heif | 2204 | `d5bfbc16e2052373fb51c214b8017f80f0b63062826fdf4661efd26c9194c190` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_tile_ABGR_tiled.heif | 2811 | `407ea7026b6093184bbbc77e41ac622e6e8237b590b60c21a1cd0df9d486aa02` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_tile_B16R16G16_tiled.heif | 4004 | `a76135566c148cfb8dbed896cb1734868af3e081d4b11b7505d5676ad6514021` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_tile_M_tiled.heif | 990 | `0ee5abaafc141cc3a0218673cd2e8b06af3d5b5f69d1e976a6008cddd04f647b` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_tile_R5G6B5_tiled.heif | 1684 | `12889f676d981ba66d1ba3c57df87ea9566c0c0e8e6703531491b8a0b61bb965` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_tile_R7+1G7+1B7+1_tiled.heif | 2204 | `4ac54c7bbc5f89d2511323f607aff7487663b66fec3e94a3d4414df6ab65d4fe` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_tile_R7G7+1B7_tiled.heif | 2124 | `00cf87847c32d4fc9cbf924788f4f78cb38f59d9283f666d281d89d20dbe374b` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_tile_R7G7B7_tiled.heif | 2084 | `bf492163dc1008b27774a82597bcecc243a326d2ec791d6697ba6410c8f7b01b` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_tile_RGB_tiled.heif | 2204 | `005a2b70e2588698f029f65ad323cc9d9681f35612ebdb04d0945f076469b8c0` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_tile_RGB_tiled_row_tile_align.heif | 4844 | `04b433aea382cc99d3f5735dbd7a40ed240c83083a5b3fe6c2e5576c2bed4079` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_tile_RGxB_tiled.heif | 2811 | `abd7e71b3fbff44d1fef37a5d7e822626d611c6ce31243266b481c787d2ba13e` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/libheif-testdata/uncompressed_tile_YUV_tiled.heif | 2204 | `df21e83623a30040e7a2b48ad46e9d9e3c55e616458b08fb9d159d818a8a9324` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/nokia-conformance/C001.heic | 893729 | `b0ea1bcca6f4a1317b7a513bbf23f279e3b47dc6c6ba22031d8939cceb341456` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/nokia-conformance/C002.heic | 111897 | `2b836102e528f7b465b295724b6928c5725a5ac3fe326c6bb54e5e8a18fc180f` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/nokia-conformance/C003.heic | 224452 | `ce14515a9be842859c340f6695c3c65911f356bf292cf84d1f23a2aeaec4b028` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/nokia-conformance/C004.heic | 1366422 | `a5cccb3f7cb602d21d44b8e50dedec4c2aacd425da8653a053215e846e7b42db` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/nokia-conformance/C005.heic | 113771 | `8df455f463861613a3fc09327472739663c876af1d8d096f68cc3e16d25edeb8` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/nokia-conformance/C006.heic | 112445 | `41699c9a89dacb7a9536f43ae98f6554b9f272feb7397174cdc38b25387d7934` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/nokia-conformance/C007.heic | 535814 | `789ef64b3dfc7d39c38c407da8329642dcccb90473228c04ab6826c390ca4345` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/nokia-conformance/C008.heic | 224526 | `1d4b5cce1192b0961e4d8505a62099d39ee4f6f6ba516892e730b567997e5987` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/nokia-conformance/C009.heic | 224452 | `7d1aa4012bb69a13fc4cad8d875368fa703407cd74c20363455b8520b791b412` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/nokia-conformance/C010.heic | 224488 | `35a82540cca9d9b38f7d6e3f304a0006696f5a9f20874d544be7ad63f6e105e6` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/nokia-conformance/C011.heic | 254323 | `99fdfcb7a0d7861c96747e3d2ac5fc25bff0ef3b39d530c9f52d07a0ed65d1c2` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/nokia-conformance/C012.heic | 1497807 | `117106d67be07d1488eb89b0c9b18670b021f4e1d6376f27fdc57cd7cdca7355` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/nokia-conformance/C013.heic | 224534 | `433057d6ee4faf13490fd616921889eabd7194e9e1bea9748be7e941d880255e` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/nokia-conformance/C014.heic | 224629 | `4acf8abc58bd5a8f9cc4e4f05e01a3712934d2a86824dd2ff65d3c92d8060176` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/nokia-conformance/C015.heic | 224592 | `b25c5191b40a1ba5fe6c5c281c5042499ac77b267529de90248fd7ad94104c11` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/nokia-conformance/C016.heic | 112029 | `0a8bc81b1ba4b8437e527a9fe3b254fe48933b0b5672ff6a23177f76b24950fb` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/nokia-conformance/C017.heic | 60276 | `7bd45ec3b278a601d4ba1905964856cf0003b15896adfffe3f645fd83c0417cd` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/nokia-conformance/C018.heic | 60276 | `67a5bde732421439557b9e43e601781210556456a040a43036af199f1880eae0` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/nokia-conformance/C019.heic | 60276 | `9f094bb21cd5cf5da53b354ea22c37a059390b1c121c4eafe88f359a0623f402` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/nokia-conformance/C020.heic | 60276 | `4f95f844cfa7615150a0acfe6dd6599228bceb7f76885a305a46278b666c26c3` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/nokia-conformance/C021.heic | 112035 | `addd129b0847cacd8d4cc2403e6baf337cfc30e978e1e54771f547156a17c12e` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/nokia-conformance/C022.heic | 535814 | `07cb91171df0b324b44d3fee09b1f205524652997928445b530e1c463a8c57de` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/nokia-conformance/C023.heic | 535958 | `35555c641992f40db8d12b37cc3ea4264e5b45eb25e425f08ee7093b47ccffe5` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/nokia-conformance/C024.heic | 111999 | `039cbb9631558d76fe8240a8c45f9a2a3a0645ba19bdf7665b9f9951e65c2764` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/nokia-conformance/C025.heic | 19824 | `8921aa6ccb29aa49a1122c602cdcbecb0a2dcdcae3cd1422631ac794bad72a69` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/nokia-conformance/C026.heic | 893418 | `c2561b8da054723a5e85e4f551620c00e956d86bc07053c8ff44309c829876cd` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/nokia-conformance/C027.heic | 465001 | `7a2f66f785d38676fe5c4a2e37365617c80931052eb2aecc866154afb7c14cdc` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/nokia-conformance/C028.heic | 450805 | `2bafef3c563913e4653292da8be9b21a36fe15e87cdf6510dfaf588fe2e145b0` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/nokia-conformance/C029.heic | 893466 | `9b8678d222576f834c371d9cc499854b0a5c7bb8ceecbc816cdee2d3fbed42ad` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/nokia-conformance/C030.heic | 893466 | `018bf04b8ab7354f8d14a438a299cdd25e685e3217c7387508c47d32d91436d0` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/nokia-conformance/C031.heic | 894029 | `cf9e46d7ed8e899d091db068ded7b5e02aa00d33848463484eaa736b3aeb6558` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/nokia-conformance/C032.heic | 907554 | `7b14be0e0a0a8ae8c0909b0c594a8cdc7a16143e1cea3ce476f2be59bd4e5402` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/nokia-conformance/C034.heic | 112147 | `d2d61c040eba858cff05d7804c0999fb8955bcfe3ec99e5fd9f0b90d2dd2fe97` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/nokia-conformance/C036.heic | 893454 | `85b45f190ec7c3dd26f09ce703f9aa6c2edeadb69f4648044ba9c3a059fab8a4` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/nokia-conformance/C037.heic | 893454 | `86d538a4175b25cd2f75c31b64f4d2fce431adf4b0e9cf1239a01203d64cb8e4` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/nokia-conformance/C038.heic | 893454 | `a2b57365e6dbfdd96b20cabc12e47c02c9a137539f8313312a8841de8af6c7dc` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/nokia-conformance/C039.heic | 112106 | `507e4fe241b73e098050ac12d6cefe84efbf2acf0d7f8b0b23f23480f6911658` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/nokia-conformance/C040.heic | 156836 | `7d9160ff8f2e0f195c870484dee255383f549243ec782d70c3cc9431bc5ec268` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/nokia-conformance/C041.heic | 52191 | `7a90757b22d3448267f44cc163e19611961e1228cd67a614b6ac8c4144bf082d` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/nokia-conformance/C042.heic | 111907 | `ac0c075dfe02520fabc3d1b078d8502eabf950e77011a663dbd9015fbb886aeb` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/nokia-conformance/C043.heic | 163718 | `4d9e131a9e896625348b374605d4b65d62b64178d31c938b5302fb704c2a2042` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/nokia-conformance/C044.heic | 146457 | `550443448520e724af11734f86d51e50a8e42e3f4b5ed47debc2c5d25fdb3190` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/nokia-conformance/C045.heic | 308053 | `9dd45ad0c14713cf82703e753048580b22152c3f35aa4610e446418efb47d654` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/nokia-conformance/C046.heic | 219956 | `bf96038a23a7acd278315497c8384e8e7c1f01e93ee15852d7959b0ff0db5dc8` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/nokia-conformance/C047.heic | 191043 | `8c5fe84142d463ae621636f54603d33fdfa154072713477a58fc9a4c1de890ce` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/nokia-conformance/C048.heic | 482892 | `3c47929c8908605e0958e105172f07a834f5cb91da70bd35489f687dfb13690c` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/nokia-conformance/C049.heic | 536942 | `c63c05ee4a19f661d8454c02f537e80118123010c9bbba24c33a79fc11ab2389` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/nokia-conformance/C050.heic | 816853 | `3be11849d3b744c9a96e58dc22361a6f34fbb8db440326957529823cc43b5955` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/nokia-conformance/C051.heic | 223513 | `d7f22fca9974cca7e62e1481044b6b379c534a44ec97258ab4b28e95fd2caa59` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/nokia-conformance/C052.heic | 112488 | `05d2017881b23b1e9adc5585e9ec725b47dec1ca74b6854ba2375772f0b18166` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/nokia-conformance/C053.heic | 14550 | `c641d26a9189371f9320827ba035eb05bc241975fdc9e6e60540f52de3feae97` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/nokia-conformance/MIAF001.heic | 113797 | `c15fcd574e108a9a2933cb6e5e5680df1cbf1e917379d88306e6c89c63b22055` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/nokia-conformance/MIAF002.heic | 8837 | `006baff837e3a8736154206f901a6595b0951eb62e282463e7dfc4a33c3da775` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/nokia-conformance/MIAF003.heic | 13826 | `499c8ef32ff744f42b06cc89d6404dcc3754043d2251f4b6f8fedf2f6f04a513` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/nokia-conformance/MIAF004.heic | 113801 | `6625d8a5f13390134c808ac3a86f7c2f293400f2efc381383502b2910415ebc1` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/nokia-conformance/MIAF005.heic | 893854 | `d0dae956c59747326c2966786a1e88d3c8c2818ae5e701211da81328fa828d49` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/nokia-conformance/MIAF006.heic | 280345 | `944952d316c9b1681afe67b2ad6a60bda53c9413ece54fe6a04f003b0cf5fd7d` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/nokia-conformance/MIAF007.heic | 113861 | `370489520fd6f97dab4dbf2e81c1d77f9e19b0bfb28996245a2dc313af8ea81c` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/nokia-conformance/multilayer001.heic | 18582 | `7b50db4483d31d78306cd1bf6e5b7d43d497d1cba6ac5b6895cadc546883164c` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/nokia-conformance/multilayer002.heic | 19699 | `b4536629a8054a50e37c1d707a61c68b3f5f2284ec5fd36f6705c4e07063727e` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/nokia-conformance/multilayer003.heic | 14512 | `8e3963d7a0f997ad78be13809cccbe125482c5c961a30a0cb043b6aba0c870cb` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/nokia-conformance/multilayer004.heic | 14132 | `25fa4a3ff860370a1f1da643cd2b96a16520dd1255d7e70fbcac564374a49cfb` | heif | unknown |
| imazen-codec-corpus/heic-conformance/valid/nokia-conformance/multilayer005.heic | 4608 | `43cd906e0f04e12ceb007e683d637b68c72184f2118a69882e19f286c69f73d2` | heif | unknown |
| imazen-codec-corpus/avif-conformance/edge-cases/apple_free_property.avif | 2064027 | `6637b906aecc85228b61b6da3899370fdd46abe44cb91cc752ec2b7fbd9dc698` | avif | unknown |
| imazen-codec-corpus/avif-conformance/edge-cases/apple_unknown_nonessential_property.avif | 2064028 | `5de42614c3142e1be4a14c0856d6db6e26cdf216f832398ea47167479e3ed8e7` | avif | unknown |
| imazen-codec-corpus/avif-conformance/edge-cases/libavif_alpha_noispe.avif | 1403 | `8deb96e78c3e5d608a157b2de4c98eb1a30e0c85736b4230758400509c88d47e` | avif | unknown |
| imazen-codec-corpus/avif-conformance/edge-cases/libavif_arc_triomphe_extent1000_nullbyte_extent1310.avif | 2601 | `709b48ce4481a70efe725ae5e5da4d0e5482d8fd126cee8bd42da31c0b67823c` | avif | unknown |
| imazen-codec-corpus/avif-conformance/edge-cases/libavif_circle_custom_properties.avif | 1065 | `6c57595c1b814392c6a0d0e1f60e34c6f7f09a8ce7e46885d85059b7205e82fb` | avif | unknown |
| imazen-codec-corpus/avif-conformance/edge-cases/libavif_clap_irot_imir_non_essential.avif | 653 | `33f869fcf2a879913eb394982b8fc03e9a60c25831aa37622ddefa656fd39fc1` | avif | unknown |
| imazen-codec-corpus/avif-conformance/edge-cases/libavif_clop_irot_imor.avif | 653 | `28e96ad4c913d75a32d66bce116f2963e29d93c01952698c7b33dd893f8bd541` | avif | unknown |
| imazen-codec-corpus/avif-conformance/edge-cases/libavif_color_grid_alpha_grid_tile_shared_in_dimg.avif | 2781 | `1924ad27fa74aff5278367245d56e14804f6f5a6ac9fbc3da19b39033e167235` | avif | unknown |
| imazen-codec-corpus/avif-conformance/edge-cases/libavif_draw_points_idat.avif | 498 | `ce2fd627efae49391ea82584e9beae05959b867ba429e688a2b95a015b38d3db` | avif | unknown |
| imazen-codec-corpus/avif-conformance/edge-cases/libavif_draw_points_idat_metasize0.avif | 498 | `a5f429bef6d2ef2f6022be4848d7266145bfaa060c0fe684150411fa4bf562a1` | avif | unknown |
| imazen-codec-corpus/avif-conformance/edge-cases/libavif_draw_points_idat_progressive.avif | 600 | `077ab2ad1e46dd912a973e4f024cb1eb242a08298be2dbf1a52a058e88c48a4a` | avif | unknown |
| imazen-codec-corpus/avif-conformance/edge-cases/libavif_draw_points_idat_progressive_metasize0.avif | 600 | `1921cbbf0002c1fba64072298a1a232d106b46ea1b427574723db66d90c3443e` | avif | unknown |
| imazen-codec-corpus/avif-conformance/edge-cases/libavif_extended_pixi.avif | 330 | `7de53620b571aa61f54df2fc00cfa32955cd4e474a6a4b723a513b51ef21e946` | avif | unknown |
| imazen-codec-corpus/avif-conformance/edge-cases/libavif_seine_hdr_gainmap_wrongaltr.avif | 122961 | `23990f6493467f13a313c629dec3c98a6560b85dbfbb11bfb2ab8a6bc9850bbf` | avif | Google |
| imazen-codec-corpus/avif-conformance/edge-cases/libavif_seine_sdr_gainmap_gammazero.avif | 129766 | `faf73bb88eb6ed048aefb864db41fb69fa16952d6a1c1246b563465ae020edda` | avif | Google |
| imazen-codec-corpus/avif-conformance/edge-cases/libavif_seine_sdr_gainmap_notmapbrand.avif | 129769 | `63da24747562724235e3fc803d2230d25bf5a4f91112aa87a3b804a333f12d7f` | avif | Google |
| imazen-codec-corpus/avif-conformance/edge-cases/libavif_sofa_grid1x5_420_dimg_repeat.avif | 25409 | `0a2abbe8b388df51e51b47cc4f1a932fed8c64d340490604fe6b510d77025514` | avif | unknown |
| imazen-codec-corpus/avif-conformance/edge-cases/libavif_sofa_grid1x5_420_reversed_dimg_order.avif | 25409 | `8a77888b3d8b4876636666e4f8ebfaf6248361700b78e34b12dfc458919bd2b7` | avif | unknown |
| imazen-codec-corpus/avif-conformance/edge-cases/libavif_supported_gainmap_writer_version_with_extra_bytes.avif | 1375 | `189398ea72d391c75c8679942c539ae7d4324152fa2f948d742b73f3bd6cc8f1` | avif | unknown |
| imazen-codec-corpus/avif-conformance/invalid/apple_truncated_elementary_stream.avif | 1999894 | `831a1ca95606085d28fe226d953f3ec2d59cdbe1ae83a7da682a960f0a189355` | avif | unknown |
| imazen-codec-corpus/avif-conformance/invalid/bad_ftyp.avif | 80743 | `81930424e7309a00a436ee7b3198cbf9c6d50c3444fdafb09e2c123db9fd1db7` | unknown | unknown |
| imazen-codec-corpus/avif-conformance/invalid/corrupted_mdat.avif | 80743 | `c7d4d117cac18166ec2db39e8b7978627ac18af3f0ae8a202b570554847f47a8` | avif | unknown |
| imazen-codec-corpus/avif-conformance/invalid/empty.avif | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` | unknown | unknown |
| imazen-codec-corpus/avif-conformance/invalid/libavif_unsupported_gainmap_minimum_version.avif | 1371 | `d675f46519029ce3da98fac587cb25fa2eb33c7b77d7ae5c04903b2825367331` | avif | unknown |
| imazen-codec-corpus/avif-conformance/invalid/libavif_unsupported_gainmap_version.avif | 1371 | `f67ef979ee9df50c7893eafea591030b3897dba1285ea8331dc0687e063dda9b` | avif | unknown |
| imazen-codec-corpus/avif-conformance/invalid/libavif_unsupported_gainmap_writer_version_with_extra_bytes.avif | 1375 | `1ede5af67433062cffd620833d2b132e1572348596c5659ad2ed4c4d708edd83` | avif | unknown |
| imazen-codec-corpus/avif-conformance/invalid/not_avif.avif | 22 | `d20f6ffd523b78a86cd2f916fa34af5d1918d75f7b142237c752ad6b254213ab` | jpeg | unknown |
| imazen-codec-corpus/avif-conformance/invalid/truncated_data.avif | 40371 | `9d489e2d86315fa9364b68e34583eb631eb3a9992c98304e5fa576c116371f26` | avif | unknown |
| imazen-codec-corpus/avif-conformance/invalid/truncated_header.avif | 100 | `bb5016ad81a6f119235a7b485811371e85cc3bc70a5650ab3b8a8d5fd89763c3` | avif | unknown |
| imazen-codec-corpus/avif-conformance/invalid/wrong_brand.avif | 80743 | `fecd6abc9b3d85eeeaf2cf737ce2ca081ebea6e79d6c9a172afe4da682c59c05` | avif | unknown |
| imazen-codec-corpus/avif-conformance/invalid/zero_dimensions.avif | 80743 | `be2fcaaddf47b3404194b8dcee1ef2695e84542f7a0ba17b97856ced3e5e8b93` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/2.avif | 165908 | `a754543bc9348cae394a17f537209bd52dd9c598d89abc4f989e8c82a407e1d6` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/apple_animals_00_multilayer_a1lx.avif | 1999854 | `62edad3dffbdd094d91c729cf3c599efe60a15274d283a8604affb0e3b6abcc4` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/apple_animals_00_multilayer_a1op.avif | 1999923 | `5b150c2e9bdf8bde459a81d74827c1ae07dacc2684054fcac78e4a8676021743` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/apple_animals_00_multilayer_a1op_lsel.avif | 1999985 | `8c58289820b0ab4a1345e997fbc7d697860ab1488b6f84891a414f32edef5fe4` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/apple_animals_00_multilayer_grid_a1lx.avif | 2306847 | `b65d38bf37acad4d91ef6b9c6a7b8e785a344db37ef248afd91cd583d54111d1` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/apple_animals_00_multilayer_grid_lsel.avif | 2307078 | `5260c251d9f0161be51d134cbe39642357cd4d36826599d408ae5c3c88b902a1` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/apple_animals_00_multilayer_lsel.avif | 1999913 | `eae84e3e812db46af7953da1ce208e11541a362fbcfc91417bbe60b93341d588` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/apple_animals_00_singlelayer.avif | 2064011 | `0fe539e86b5eadaf64d9049ebb195c49af6bc3f3e0e5f959f91ac296bc701f6e` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/libavif_abc_color_irot_alpha_NOirot.avif | 10596 | `f2c8cd6ded641c68d13b3363417a62288a5eb335870de8d0b9da5093865ffb9a` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/libavif_abc_color_irot_alpha_irot.avif | 10597 | `b371cc88244a873131e4d10ff9363d71ce4f41cf333bd4a491b38d970d9abd3b` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/libavif_color_grid_alpha_grid_gainmap_nogrid.avif | 2870 | `c424c43fe4bab3b8ef37b86c0bab3851b850b94e5d46b9fae979586dae45de0a` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/libavif_color_grid_alpha_nogrid.avif | 2373 | `bae56368b348b1d847e2bfb662522599f0c63dfe62fb68826c9e42a300ff405d` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/libavif_color_grid_gainmap_different_grid.avif | 3101 | `73a68c3d6daad7b8298db975a00f02bca46b6c3f292eac09d3c1443d2006fab2` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/libavif_color_nogrid_alpha_nogrid_gainmap_grid.avif | 1875 | `d783e0d9ce778f972e88586b6b1b9eb062f54d38f28521721a8b9cbbda3b7fb0` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/libavif_colors-animated-12bpc-keyframes-0-2-3.avif | 2267 | `3bf9f91da471749e7df639ba7945d4d94c1c3e3968c26f3619fbbcfc92790576` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/libavif_colors-animated-8bpc-alpha-exif-xmp.avif | 7506 | `c2e38681057c15009c4b76ea08cea68cdde80806abd41d42a646f697bf5aabb2` | avif | Google |
| imazen-codec-corpus/avif-conformance/valid/libavif_colors-animated-8bpc-audio.avif | 3505 | `624f3bfe78b6bd75e9e12fe9b36c6132e3effaf82aa2a443f1b2a207a7d3561b` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/libavif_colors-animated-8bpc-depth-exif-xmp.avif | 7506 | `93177031f6177cff1e14c9065eb9dc97dbd7bbfa3e32a8b99af222398be1daac` | avif | Google |
| imazen-codec-corpus/avif-conformance/valid/libavif_colors-animated-8bpc.avif | 1235 | `2f8683d21725261f37f86e115f0c212cc52d0fefd3a2ddfcc4fa648c1859906d` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/libavif_colors_hdr_p3.avif | 26532 | `ec4b67fa129360f4b44768bdd1027fb32834d1a1f7e49ae53bed44c819def9c4` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/libavif_colors_hdr_rec2020.avif | 24065 | `9980e58ddf718a923f1738c34aad1c72f8e5795ec07e68f1a5f9bd216ca19740` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/libavif_colors_hdr_srgb.avif | 28030 | `1aecb78d6d363caae95a5dd198f347ce4b200073ced638647364a2ad04d9707d` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/libavif_colors_sdr_srgb.avif | 18845 | `24463b9b79e4624d06e247079efddf624f9062c516d43ddf6fe5e150343629d6` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/libavif_colors_text_hdr_p3.avif | 29054 | `69a5e7171e13591be94371acd63c65f8f73ee096af0cfe6b819c5f4e2350ed01` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/libavif_colors_text_hdr_rec2020.avif | 28573 | `ebc4313b728be41b105e5828726089e82a785fdbdf2ad5cdef3aacc009ee7e25` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/libavif_colors_text_hdr_srgb.avif | 34458 | `2f9fe21f6e3363c233f0444534b7b747f2f386257dc776416357db5b970cc73e` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/libavif_colors_text_sdr_srgb.avif | 22288 | `b38e0e8f818e0a6f7db2c12ef5da5937c4378d35adec2dc46e5a1c35c095af36` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/libavif_colors_text_wcg_hdr_rec2020.avif | 33242 | `26cfca294b9403133eba46fdbf15ab04f68e48855c835be8cbec24097aa8b846` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/libavif_colors_text_wcg_sdr_rec2020.avif | 25007 | `1fba1a2ce322c7e1d5966517f110dfcf134005644c1e6207acf0dd7bb4e60708` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/libavif_colors_wcg_hdr_rec2020.avif | 20613 | `848d4e3ad357e73c9d7183146ab65ef2e5e4e482183d3617fcb7e31804a54110` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/libavif_io_cosmos1650_yuv444_10bpc_p3pq.avif | 37451 | `1c3db1867051ae23ba61ed217f6b7372a4248e6322d76a239feab14bc4c55ab5` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/libavif_io_kodim03_yuv420_8bpc.avif | 25430 | `e69c973a3ddf635412c9a0c6cda66798102d0030303614873b337f658983ef5d` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/libavif_io_kodim23_yuv420_8bpc.avif | 21032 | `fa97744b1bad2137cac0f81fb653175362e16c6d8d20613d0769a847f2769bd1` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/libavif_paris_icc_exif_xmp.avif | 21132 | `961bc38b61e60b7651fa20efa24269ae2f35e4958822a81c908c9bbf9b3f66e1` | avif | Google |
| imazen-codec-corpus/avif-conformance/valid/libavif_seine_hdr_gainmap_small_srgb.avif | 102004 | `573a67fdd581f6e634da198a819cc92a071539dfb720c5d7dfdf02e4e87a0346` | avif | Google |
| imazen-codec-corpus/avif-conformance/valid/libavif_seine_hdr_gainmap_srgb.avif | 122961 | `9bf9c6a7606951de07e4079cd63c2cfe379d95139cd99ab9142d8a6ee22d28c7` | avif | Google |
| imazen-codec-corpus/avif-conformance/valid/libavif_seine_hdr_rec2020.avif | 87071 | `fd002bd4d51152b1cac533046ebfbc710aca7aaa519c0e7dc59d668aa12313ac` | avif | Google |
| imazen-codec-corpus/avif-conformance/valid/libavif_seine_hdr_srgb.avif | 168028 | `b4f440392ad8cdfd398aea0c8817c93d98cfd8cde381bbe430aceae0207e93c8` | avif | Google |
| imazen-codec-corpus/avif-conformance/valid/libavif_seine_sdr_gainmap_big_srgb.avif | 169759 | `b672cfd5ac792ae0a70f82b68ef7bab06c117e5d297624ec8afdf56af847c6b7` | avif | Google |
| imazen-codec-corpus/avif-conformance/valid/libavif_seine_sdr_gainmap_srgb.avif | 129773 | `e0ebdb2f1f44c7d901e6b5f817eb2520eace344624cab0d57aaa929d05d6d971` | avif | Google |
| imazen-codec-corpus/avif-conformance/valid/libavif_seine_sdr_gainmap_srgb_icc.avif | 129863 | `63fa6580a4cc215debc1229e35450c8144207218cc7ce6f5bfe5596efa357d55` | avif | Google |
| imazen-codec-corpus/avif-conformance/valid/libavif_sofa_grid1x5_420.avif | 25409 | `c9e04ff9d90d7093454750fa33b7543ee5479e0cfb151e2c3d2ce6a16c1651c1` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/libavif_weld_sato_12B_8B_q0.avif | 38100 | `fa41d615d244d50fc99d71c1fea14561e0814382a748d1b8b672c3fd5a595dbe` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/libavif_white_1x1.avif | 305 | `ea4e43d1f07e4c00de16c13afa32376111bb306e51f08212cf4c1b6064df3667` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/linku_fox_odd_both.avif | 77645 | `bb8695cacacaf8f2e13a739de75e5e8a9d970d68c3acdfb7d82171a9bac2f01e` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/linku_fox_odd_height.avif | 78504 | `75628450288ace3386651725411c8f0ffff7eb95f82c5307b0faa3350f09f50e` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/linku_fox_odd_width.avif | 78348 | `f91b6f455412adabc5094011362eaaa1f6a9d5740de0b8a1be42a96c16e7617f` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/linku_fox_p0_10bpc_mono.avif | 71882 | `e35713343e9ee04c51ab9cfdc99a0c7d126a1917cb83f5b9a23c71ed59269be2` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/linku_fox_p0_10bpc_yuv420.avif | 83040 | `811af5e96631309030a14cbc30c3bacfaa667f2e36e16a4f30434b8f5a23310c` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/linku_fox_p0_8bpc_yuv420.avif | 80743 | `cb884c82ac7b6d4fa03b1f687e9e20abc346107095473e9c1d422aaf0de14eaf` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/linku_fox_p1_10bpc_yuv444.avif | 97436 | `a10de8204aee73ba1786daca6390546bd7aa6b069aaa644012219a1c11246a43` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/linku_fox_p1_8bpc_yuv444.avif | 95375 | `a0cdc981a6b056c8af2d177a1438c332d630040dacbfd1c89bb5e3e381ba5822` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/linku_fox_p2_10bpc_yuv422.avif | 89097 | `e34f3bab5df802be2d422c685824464eb5f7e182b235ca99bde11c4c34ff3ac2` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/linku_fox_p2_12bpc_yuv422.avif | 90198 | `51476b8471e1c0a5ebbd1e7545709495bef619cc96c02d277aad32b1deff8ea9` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/linku_fox_p2_12bpc_yuv444.avif | 98800 | `ed96eca6ed79863eaf91e4d666e4e220b5fa4e5a6cb1696477ba901ac12f5dde` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/linku_fox_p2_8bpc_yuv422.avif | 86782 | `2cb363d30f83bff58ee049874b1808b37cb1d35342edf16b3ce25cb243c9ea55` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/linku_hato_p0_8bpc_yuv420.avif | 259104 | `07cd454de19dd638354f75d9e97aab08bc8a04dd45c4f7531cb62a1a5656c8c9` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/linku_hato_p2_12bpc_mono.avif | 277716 | `e28b4cacda95750e465e205fbfcba6a6af1d8418dac649838730c555ff7d828f` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/linku_hato_p2_12bpc_yuv422.avif | 380045 | `ad361ac7d94fbc6af7ef30cbd3601ff366bc360c304480387a58a4c6fecee9b6` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/linku_icc_profile_10bpc.avif | 198819 | `5842951d81118d256962384e08a986816e8ade6b05530269f0208c6b69cedb3b` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/linku_icc_profile_12bpc.avif | 315064 | `1f0c9f36d69b9aa13eff3897ada3e78b81099c613b329a402c27e09453e7e261` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/linku_icc_profile_8bpc.avif | 106983 | `3e6f2f4016e66e3c94707eaa8373e6f582321e005964cd35b64bc183e1bf10ea` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/linku_kimono.avif | 85445 | `63412e0f67f37c8b6fcf0e8269a2afae0a017fa6a3a99d37d055c590b0be52d3` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/linku_kimono_crop.avif | 85486 | `f175dcd9c64813b759da185fa67076fb772b76059845b2aad3ddcfab257f75ad` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/linku_kimono_mirror_h.avif | 84996 | `2bbc004d91145488610158a5acdb4d706495a2b15511db20ff57bb9efd80885c` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/linku_kimono_mirror_v.avif | 84632 | `f10eb04791fcca3409868b367128649f32e6b6fffcf02484cdefa57909f6bb74` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/linku_kimono_mirror_v_rotate270.avif | 85529 | `33c36ec2274b00ac6f81c9f61e55c20cbfce1649ad27520afe635310f516ead1` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/linku_kimono_rotate270.avif | 84886 | `79a99a0415276cc11f2e871d070a9df84df3385888a2f2fa3534320f6bed98ed` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/linku_kimono_rotate90.avif | 84837 | `bd1157d8c840713c82b907b9d3ae80bc3817849e11c323d875f8016e035bd3cc` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/linku_plum_p0_10bpc_alpha_full.avif | 49032 | `cf8e15ec4b210235f3d68332a1adeb64e35c41b8d8e1e7586ae38b6d9cd8926c` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/linku_plum_p0_8bpc_alpha_full.avif | 36191 | `21ebb3732186bf7c6c13cf7197155b64201e674b9c79cf613b6e5718bde14c2a` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/linku_plum_p0_8bpc_alpha_limited.avif | 35946 | `f4809df9188fa46ed100f63c78c4cf42559d90a98351a8f69e177385920672b4` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/linku_plum_p0_8bpc_alpha_mono.avif | 34060 | `65917797e511c9033b3e225eb5d84f3c0440b7a496d4b8ab5674e123ad68aab7` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/linku_plum_p1_10bpc_alpha_full.avif | 51332 | `0a615cfb673ab45e37da3582c17dd36f86d5da3d81246a32951d1db4ed90149d` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/ms_Chimera_10bit_cropped_to_1920x1008.avif | 95953 | `7eb3cac7667b6089e91ee6f585e6d3aed8f22038bbcef3170a6537c3307beea5` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/ms_Chimera_10bit_cropped_to_1920x1008_with_HDR_metadata.avif | 95999 | `b52996d7dc8bde2145770fc1977ccd45e7faf78c561599f325b48669d5ff6aee` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/ms_Chimera_8bit_cropped_480x256.avif | 38534 | `d86d67a6c37e61dfa34e071116daa467afe6304b9ca110ab87ba898631f262fc` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/ms_Irvine_CA.avif | 28133 | `ee9b8544668ba71e584311be8eb590d0a92464aa24aa75ab05af92ab4c9ccf4c` | avif | Apple |
| imazen-codec-corpus/avif-conformance/valid/ms_Mexico.avif | 219216 | `96bf0656417dca608ea9de0314b6e526fa8910d112ed01054d8842be1947e91f` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/ms_Mexico_YUV444.avif | 158840 | `0b19224abea8055ee82295bd1d1171ef18d713dff7782c70b943fbdd837c8af7` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/ms_Monochrome.avif | 7436 | `deeb37c2cf321d3ccacff085a6fed50cc774dd38d7ed271c15517ccd01bd7a4f` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/ms_Ronda_rotate90.avif | 96412 | `3909699e338935e7934591c0bc20da5e698e5d968d29c29cc37c02de4576996b` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/ms_Summer_Nature_4k.avif | 280380 | `bae6a3b420018fc725e862593d1c78c8261c9f734f4ce41a69c1a9906296e302` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/ms_Summer_in_Tomsk_720p_5x4_grid.avif | 1964802 | `c9148149b108f5fbce7300903bd59937bfc4c677f2ce359668ad664adb18ec2f` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/ms_Tomsk_with_thumbnails.avif | 10864 | `e1635d66a6ba59c59893a0a2f17dc4fbda89183d8f2e78919bc472091a9de6e8` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/ms_bbb_4k.avif | 31605 | `5ba24612f2a7a8a6eae122e8422a723413b969bca4253ab2ce19eb65e3e15abf` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/ms_bbb_alpha_inverted.avif | 8468 | `83d68084a93f043a89d10373f0ca26dafc988eec811b8076cabb2ff1580c1817` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/ms_kids_720p.avif | 57637 | `a68913ccfff7194f0de62de88e09b2d0b65df463aa98d00df068e17436759c98` | avif | Flip |
| imazen-codec-corpus/avif-conformance/valid/ms_reduced_still_picture_header.avif | 8077 | `89e803ae15fa438bcce2b955c36b174b836daf93a1fff9187bb9ee0ec1b2f5a7` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/ms_still_picture.avif | 8087 | `6f06c9fb62908bff0165dcbd3e51b143cc80619f46b41b382f8cf6e634b009bd` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/netflix_alpha_video.avif | 10743 | `493d6325d1981f7c98074266f91c5119599271396f6e9a0670c16904ead9113d` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/netflix_chimera_animated_10bit.avif | 164551 | `513349266e01f49a78b74842f20b7b3fffbe04b2ae052daebdd88ea35719624a` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/netflix_hdr_cosmos01000_lossless.avif | 2030588 | `efe30713c631bab92b3cdfee9e20a655af239e9bf77a3a900e619e314e792ee1` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/netflix_hdr_yuv420_qp10.avif | 92521 | `7795531dda81d609b47c2172ad543750bda1bf576c5da9f040bd81127a2040fc` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/netflix_hdr_yuv420_qp40.avif | 9829 | `f5a675c7bc8751a6aef568ab6104ef2095216c49f18ad847cf3433f4c92ace7a` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/netflix_hdr_yuv444_qp10.avif | 129753 | `d44f67cb7f486cc28b40c9d53e9c32bff682ce4112686e2afbb3b98518e3d8d1` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/netflix_hdr_yuv444_qp40.avif | 12877 | `81e166029297a08a8567d9c2ba101370fac8beadfc1bcd9e9a63c93c0330a2c1` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/netflix_sdr_cosmos01000_lossless.avif | 1323664 | `755c22689781eaa5492847c5fee9553247826c0f22aa36d3a05a8373857c4b24` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/netflix_sdr_yuv420_qp10.avif | 92169 | `8b5ca69bbbe56cbe048a0dc6b400cdfa00e5cccef4ac106db475d9b0c22a1678` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/netflix_sdr_yuv420_qp40.avif | 12486 | `a8b8a5707bf0c09701a49802772a9b2a645baa212f329429dd9f9c5275796a69` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/netflix_sdr_yuv444_qp10.avif | 129970 | `104d3b1764d74405964b09ec368718ff18cdb32cb184ced2ad46dced6def2997` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/xiph_abandoned_filmgrain.avif | 141549 | `d7c35d24ec249c2c8ed5361995b0dad11dbda9a0f565a574154fc7cbc5e5bcb2` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/xiph_fruits_2layer_thumbsize.avif | 35527 | `50946ccc489beec9e649f8f6bb63a18582043218afd1c1ee0df4c2cdf72b7e22` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/xiph_quebec_3layer_op2.avif | 86653 | `d7baadb0f75d230dabeb9b376bbb75ab15dbe1e05ad92b7487937815f21daa25` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/xiph_tiger_3layer_1res.avif | 70975 | `46cb55301f5d4a36a72c8c00f1d7e10c6c9ae0297811dc0f38a26a0285daa316` | avif | unknown |
| imazen-codec-corpus/avif-conformance/valid/xiph_tiger_3layer_3res.avif | 65012 | `ffe6d8f7f1d027c49425068ab4acddab99e5fd1fdacfd61a74b25a47e9849fad` | avif | unknown |
