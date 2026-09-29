import Foundation
import ImageIO
import Vision

func fail(_ message: String) -> Never {
    fputs("simulator-ocr: \(message)\n", stderr)
    exit(2)
}

guard CommandLine.arguments.count == 2 else { fail("usage: simulator-ocr IMAGE") }
let url = URL(fileURLWithPath: CommandLine.arguments[1]) as CFURL
guard let source = CGImageSourceCreateWithURL(url, nil),
      let image = CGImageSourceCreateImageAtIndex(source, 0, nil) else {
    fail("could not read image")
}

let request = VNRecognizeTextRequest { request, error in
    if let error = error { fail(error.localizedDescription) }
    let observations = (request.results as? [VNRecognizedTextObservation]) ?? []
    for observation in observations {
        if let candidate = observation.topCandidates(1).first {
            print(candidate.string)
        }
    }
}
request.recognitionLevel = .accurate
request.usesLanguageCorrection = false
request.minimumTextHeight = 0.008

 do {
    try VNImageRequestHandler(cgImage: image, options: [:]).perform([request])
} catch {
    fail(error.localizedDescription)
}
